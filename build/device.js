var HID = require('node-hid');
var devices = HID.devices();
console.log(devices)

const MPD_VENDOR_ID = 1452; // Exemple de Vendor ID pour AKAI (doit être vérifié)
const MPD_PRODUCT_ID = 33028; // Exemple de Product ID pour MPD218 (doit être vérifié)
const config = JSON.parse(fs.readFileSync('public/mpd218.json', 'utf8')); 