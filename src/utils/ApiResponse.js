class ApiResponse {
  constructor(statusCode, message = "Success", data = null, success = true) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = success < 400;
  }
}

export default ApiResponse;
