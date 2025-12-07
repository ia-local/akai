fetch('http://localhost:3145/code', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    commande: '/code make the box green and rounder'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));