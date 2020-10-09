import * as guestsService from '../services/guests.service';


// export const whatsapp = async (req, res) => {
// 	const resp = await guestsService.whatsapp(req);
// 	res.status(resp.status).send(resp.data);
// }

export const addGuest = async (req, res) => {
	const resp = await guestsService.addGuest(req);
	res.status(resp.status).send(resp.data);
}

export const setGuestTable = async (req, res) => {
	console.log('set guest table controller')
	const {id,table}={...req.body}
	const resp = await guestsService.setGuestTable(id,table);
	res.status(resp.status).send(resp.data);
}

export const getTablesGuests = async (req, res) => {
	console.log('get guests controller')
	const uid = req.user._id;
	const resp = await guestsService.getTablesGuests(uid);
	res.status(resp.status).send(resp.data);
}

export const getGuests = async (req, res) => {
	console.log('get guests controller')
	const uid = req.user._id;
	const resp = await guestsService.getGuests(uid);
	res.status(resp.status).send(resp.data);
}

export const editGuest = async (req, res) => {
	console.log('edit guest');
	const id = req.params.id;
	const body = req.body;
	const resp = await guestsService.editGuest(id, body);
	res.status(resp.status).send(resp.data);
}

export const deleteGuest = async (req, res) => {
	console.log('delete guest');
	const id = req.params.id;
	const resp = await guestsService.deleteGuest(id);
	res.status(resp.status).send(resp.data);
}
