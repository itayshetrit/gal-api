

import * as authService from '../services/auth.service';



export const login = async (req, res) => {
	console.log('login controller');
	const { phone, password} = req.body;
	const resp = await authService.login(phone, password);
	res.status(resp.status).send(resp.data);
}

export const logoutAll = async (req, res) => {
	console.log('logoutAll controller')
	const resp = await authService.logoutAll(req);
	res.status(resp.status).send(resp.data);
}

export const checkAuth = async (req, res) => {
	console.log('checkAuth controller')
	const resp = await authService.checkAuth(req);
	res.status(resp.status).send(resp.data);
}