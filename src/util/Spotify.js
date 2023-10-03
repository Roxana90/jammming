const clientId = 'f7e31ba8d88a4e6a815b110a831b3fd5';
const redirectUri = 'http://localhost:3000/';
let accessToken;
let userId;


  const Spotify = {
    getAuth () {
      const tokenURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = tokenURL;
  },

  checkAuth() {
      const authenticated = window.location.href.match(/access_token=([^&]*)/);
      if (authenticated) {
          accessToken = authenticated[1];
          return true;
      } else {
          return false;
      }
  },

    getUserName() {
      if(!accessToken) {
          return Promise.reject(new Error('Access token is missing'));
      }
      const nameEndpoint = 'https://api.spotify.com/v1/me';
      return fetch(nameEndpoint, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
          }
      })
      .then((response) => {
          if (response.status === 200) {
              return response.json();
          } else {
              throw new Error('Failed to fetch user data');
           }
      })
      .then((data) => {
          const userName = data.display_name;
          userId = data.id;
          return userName;         
      });
  }, 

    search(term) {
      return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }).then(response => {
        return response.json();
      }).then(jsonResponse => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }));
      });
    },

    savePlaylist(name, trackUris) {
      if (!name || !trackUris.length) {
        return;
      }
  
      const headers = { Authorization: `Bearer ${accessToken}` };
      return fetch('https://api.spotify.com/v1/me', {headers: headers}
      ).then(response => response.json()
      ).then(jsonResponse => {
        userId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({name: name})
        }).then(response => response.json()
        ).then(jsonResponse => {
          const playlistId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({uris: trackUris})
          });
        });
      });
    },

  };

  export default Spotify;