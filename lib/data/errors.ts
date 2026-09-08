export class DataAccessError extends Error {
  constructor(message = "No pudimos cargar tus datos en este momento.") {
    super(message);
    this.name = "DataAccessError";
  }
}
