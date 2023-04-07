/**
 * Waits for the given amount of time in seconds.
 *
 * @param {number} timeToWait - The time to wait in seconds.
 * @returns {Promise<void>}
 */
 async function wait(timeToWait) {
    await delay(timeToWait * 1000);
    console.log("Finished waiting");
  }
  
  /**
   * Delays the execution of a function for the given amount of time.
   *
   * @param {number} ms - The time to delay in milliseconds.
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  export { wait };
  