async function main() {
  const server = http.createServer(async function (req, res) {

  if (req.url.startsWith('/oauth2callback')) {
    let q = url.parse(req.url, true).query;

    if (q.error) {
      console.log('Error:' + q.error);
    } else {

      // Get access and refresh tokens (if access_type is offline)
      let { tokens } = await oauth2Client.getToken(q.code);
      oauth2Client.setCredentials(tokens);

      // Example of using Google Drive API to list filenames in user's Drive.
      const drive = google.drive('v3');
      drive.files.list({
        auth: oauth2Client,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
      }, (err1, res1) => {
        // TODO(developer): Handle response / error.
      });
    }
  }
}





// initTokenClient() initializes a new token client with your
// web app's client ID and the scope you need access to

const client = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_GOOGLE_CLIENT_ID',
  scope: 'https://www.googleapis.com/auth/calendar.readonly',

  // callback function to handle the token response
  callback: (tokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      gapi.client.setApiKey('YOUR_API_KEY');
      gapi.client.load('calendar', 'v3', listUpcomingEvents);
    }
  },
});

function listUpcomingEvents() {
  gapi.client.calendar.events.list(...);
}
