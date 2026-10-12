import { Pet } from '../models/Pet.js';
import { PetHealthRecord } from '../models/PetHealthRecord.js';
import { Appointment } from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { annotateVaccinations, summarizeVaccinations } from '../utils/vaccineStatus.js';

// Dates arrive as YYYY-MM-DD; store them as UTC midnight so they don't shift by timezone.
function toDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function withDates(body, fields) {
  const result = { ...body };
  for (const field of fields) {
    if (field in result) result[field] = toDate(result[field]);
  }
  return result;
}

async function findMyPetOr404(petId, userId) {
  const pet = await Pet.findOne({ _id: petId, ownerId: userId });
  if (!pet) {
    throw ApiError.notFound('Pet not found');
  }
  return pet;
}

async function findOrCreateRecord(pet) {
  return PetHealthRecord.findOneAndUpdate(
    { petId: pet._id },
    { $setOnInsert: { petId: pet._id, ownerId: pet.ownerId } },
    { upsert: true, new: true }
  );
}

function serializeRecord(record) {
  const plain = record.toObject();
  return { ...plain, vaccinations: annotateVaccinations(record.vaccinations) };
}

export const listMyPets = asyncHandler(async (req, res) => {
  const [pets, records] = await Promise.all([
    Pet.find({ ownerId: req.user._id }).sort({ createdAt: 1 }).lean(),
    PetHealthRecord.find({ ownerId: req.user._id }, 'petId vaccinations').lean(),
  ]);

  const recordByPet = new Map(records.map((r) => [r.petId.toString(), r]));
  const data = pets.map((pet) => ({
    ...pet,
    vaccineSummary: summarizeVaccinations(recordByPet.get(pet._id.toString())?.vaccinations || []),
  }));

  sendData(res, 200, data);
});

export const getPet = asyncHandler(async (req, res) => {
  const pet = await findMyPetOr404(req.params.id, req.user._id);
  const record = await findOrCreateRecord(pet);
  sendData(res, 200, { pet, healthRecord: serializeRecord(record) });
});

export const createPet = asyncHandler(async (req, res) => {
  const pet = await Pet.create({
    ...withDates(req.body, ['birthDate']),
    ownerId: req.user._id,
  });
  await findOrCreateRecord(pet);
  sendData(res, 201, pet);
});

export const updatePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user._id },
    withDates(req.body, ['birthDate']),
    { new: true, runValidators: true }
  );
  if (!pet) {
    throw ApiError.notFound('Pet not found');
  }
  sendData(res, 200, pet);
});

export const deletePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
  if (!pet) {
    throw ApiError.notFound('Pet not found');
  }
  await Promise.all([
    PetHealthRecord.deleteOne({ petId: pet._id }),
    // Keep past appointments, just detach them from the deleted pet.
    Appointment.updateMany({ petId: pet._id }, { $unset: { petId: 1 } }),
  ]);
  res.status(204).end();
});

export const updateHealthRecord = asyncHandler(async (req, res) => {
  const pet = await findMyPetOr404(req.params.id, req.user._id);
  const record = await findOrCreateRecord(pet);
  record.set(req.body);
  await record.save();
  sendData(res, 200, serializeRecord(record));
});

export const addVaccination = asyncHandler(async (req, res) => {
  const pet = await findMyPetOr404(req.params.id, req.user._id);
  const record = await findOrCreateRecord(pet);
  record.vaccinations.push(withDates(req.body, ['dateGiven', 'nextDueDate']));
  await record.save();
  sendData(res, 201, serializeRecord(record));
});

export const updateVaccination = asyncHandler(async (req, res) => {
  const pet = await findMyPetOr404(req.params.id, req.user._id);
  const record = await findOrCreateRecord(pet);
  const vaccination = record.vaccinations.id(req.params.vaccinationId);
  if (!vaccination) {
    throw ApiError.notFound('Vaccination not found');
  }
  vaccination.set({
    vetName: '',
    notes: '',
    ...withDates(req.body, ['dateGiven', 'nextDueDate']),
  });
  await record.save();
  sendData(res, 200, serializeRecord(record));
});

export const deleteVaccination = asyncHandler(async (req, res) => {
  const pet = await findMyPetOr404(req.params.id, req.user._id);
  const record = await findOrCreateRecord(pet);
  const vaccination = record.vaccinations.id(req.params.vaccinationId);
  if (!vaccination) {
    throw ApiError.notFound('Vaccination not found');
  }
  vaccination.deleteOne();
  await record.save();
  sendData(res, 200, serializeRecord(record));
});
