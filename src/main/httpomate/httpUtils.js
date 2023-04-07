/**
 *
 * Sends an HTTP request and returns the response
 *
 * @param URL
 * @param method
 * @param body
 * @returns {Promise<Response>}
 */
async function sendRequest(URL, method, body, headers) {
  console.log("Sending request to: " + URL)

  console.log(headers)

  if(!body) {
    body = null
  }

  if (headers) {
    if (headers.get('Authorization') === "Basic") {
      headers.set('Authorization', 'Basic ' + btoa(headers.get('username') + ":" + headers.get('password')))
      headers.delete('username')
      headers.delete('password')
    }
  } 


  return fetch(URL, {
    method: method,
    body: body,
    headers: headers,
  }).then((response) => {
    return response
  })
}

export { sendRequest }