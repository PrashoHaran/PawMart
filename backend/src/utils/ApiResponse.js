export function sendData(res, status, data, meta) {
  res.status(status).json(meta ? { data, meta } : { data });
}
