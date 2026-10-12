import { Router } from 'express';
import {
  listMyPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  updateHealthRecord,
  addVaccination,
  updateVaccination,
  deleteVaccination,
} from '../controllers/pet.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import {
  createPetSchema,
  updatePetSchema,
  updateHealthRecordSchema,
  vaccinationSchema,
} from '../validators/pet.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', listMyPets);
router.post('/', validateBody(createPetSchema), createPet);
router.get('/:id', validateObjectId('id'), getPet);
router.patch('/:id', validateObjectId('id'), validateBody(updatePetSchema), updatePet);
router.delete('/:id', validateObjectId('id'), deletePet);

router.patch('/:id/health', validateObjectId('id'), validateBody(updateHealthRecordSchema), updateHealthRecord);
router.post('/:id/vaccinations', validateObjectId('id'), validateBody(vaccinationSchema), addVaccination);
router.put(
  '/:id/vaccinations/:vaccinationId',
  validateObjectId('id'),
  validateObjectId('vaccinationId'),
  validateBody(vaccinationSchema),
  updateVaccination
);
router.delete(
  '/:id/vaccinations/:vaccinationId',
  validateObjectId('id'),
  validateObjectId('vaccinationId'),
  deleteVaccination
);

export default router;
