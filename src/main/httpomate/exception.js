function CustomException(message, metadata) {
    const error = new Error(message);
    error.metadata = metadata;
    return error;
  }


  export { CustomException }