export class ApiResponse {
  constructor(data, message = "Success", statusCode = 200) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      code: "OK",
      message: this.message,
      data: this.data,
    });
  }
}
