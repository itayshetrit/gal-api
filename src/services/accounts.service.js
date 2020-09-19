const uuid = require('uuid');
import axios from 'axios'
import accountModel from '../models/user'
import guestModel from '../models/guest'
// return uuid();
import { responseWrapper, responseSuccess } from '../common/respone';

const getJwtAndIdToken = (uid, id_token) => {
	const token = signJwtWithExp({ uid: uid }, '30d');
	console.log('User access token created');
	return ({ jwt: token, id_token: id_token })
}

export const addUser = async (req) => {
    try {
		const user = new guestModel({ ...req.body })
		await user.save()
		return responseSuccess({ok:1})
    } catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
    }
}

export const getUsers = async (req) => {
	
	console.log('get users service');
    try {
		const users = await accountModel.find({ role: 1 }).select(['name', '_id'])
		console.log(users)
		return responseSuccess(users)
    } catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
    }
}

const createAccountSettings = async (uid) => {
	console.log('Create settings for user with id: ' + uid);
	try {
		const settings = new accountSettingsModel({ userId: uid })
		await settings.save()
		console.log('Success to create settings: ' + settings)
		return responseSuccess({ ok: 1 })
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

const createNewGuestAccount = async () => {
	console.log('Create new anonymous user');
	let user = 1;
	let number = 1;
	try {
		while (user !== null) {
			number = Math.floor(Math.random() * 1000000);
			user = await getUserByFullName("User" + number)
		}
		const { data, status, error } = await createAccount({
			idToken: generateUUID(),
			fullName: "User" + number
		})
		console.log('Success to create anonymous user');
		return data;
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}


const updateUserPrepare = async (data, id) => {
	console.log('Update user preparetion');
	try {
		await updateUser({
			fullName: data.name,
			email: data.email,
			gender: data.gender,
			birthDate: data.birthday,
			facebookId: data.id,
			loginType: "facebook"
		}, id)

	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}


const createNewFacebookAccount = async (data) => {
	console.log('Create new facebook user');
	try {
		const user = await createAccount({
			idToken: generateUUID(),
			fullName: data.name,
			birthDate: data.birthday,
			gender: data.gender,
			email: data.email,
			facebookId: data.id,
			loginType: 'facebook'
		})
		return user;
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const anonymousLogin = async (idToken) => {
	console.log('Anonymous login service');
	try {
		let user;
		if (idToken) {
			console.log('Find after exist user with idToken: ' + idToken);
			user = await getUserByIdToken(idToken)
			if (user) {
				console.log('User is allready exist at DB ')
			}
			else {
				user = await createNewGuestAccount()
			}
		}
		else {
			user = await createNewGuestAccount()
		}
		return responseSuccess(getJwtAndIdToken(user._id, user.idToken));
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}
export const googleLogin = async (accessToken) => {
	console.log('google google google googlegoogle')
	const { OAuth2Client } = require('google-auth-library');
	const client = new OAuth2Client(app_client_id);
	async function verify() {
		const ticket = await client.verifyIdToken({
			idToken: accessToken,
			audience: app_client_id,  // Specify the CLIENT_ID of the app that accesses the backend
			// Or, if multiple clients access the backend:
			//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
		});
		const payload = ticket.getPayload();
		console.log(payload)
		const userid = payload['sub'];
		// If request specified a G Suite domain:
		// const domain = payload['hd'];
	}
	verify().catch(console.log);
	return responseSuccess({ ok: 1 })
}

export const facebookLogin = async (accessToken, idToken) => {
	console.log('Fetching user by access token')
	try {
		const userFieldSet = 'id, name, email, gender, birthday';
		const { data, status, error } = await axios.get(env.facebookApi + 'me?fields=' + userFieldSet + '&access_token=' + accessToken)
		if (status === 200) {
			console.log("User's facebook profile was found: " + JSON.stringify(data))
			let user = await getUserByFacebookId(data.id)
			if (user) {
				console.log('User is allready exist at DB ' + JSON.stringify(data))
				await updateUserPrepare(data, user._id)
			}
			else {
				if (idToken) {
					user = await getUserByIdToken(idToken)
					if (user) {
						await updateUserPrepare(data, user._id)
					}
					else {
						user = await createNewFacebookAccount(data)
					}
				}
				else {
					console.log("No id token was sent")
					user = await createNewFacebookAccount(data)
				}
			}
			if (user.status === 500) {
				return responseWrapper(user.status, { error: user.data.error });
			}
			else if (user.status === 200) {
				user = user.data;
			}
			const token = signJwtWithExp({ uid: user._id }, '30d');
			console.log('User access token created');
			return responseSuccess({ jwt: token, id_token: user.idToken });
		}

	} catch (err) {
		if (err.response.status !== 500) {
			console.log(err.response.data.error.message)
			return responseWrapper(err.response.status, { error: err.response.data.error.message });
		}
		console.log(err.stack)
	}
	return responseWrapper(500, { error: "Failed authentication" });
}

export const updateUser = async (data, id) => {
	console.log('Update user with id: ' + id + 'with this new data: ' + JSON.stringify(data))
	try {
		const user = await accountModel.updateOne({ _id: id }, { $set: { ...data } })
		if (user.n === 0) {
			console.log('user with id: ' + id + ' was not found')
			return responseWrapper(404, { error: 'user with id: ' + id + ' was not found' });
		}
		if (user.nModified === 0) {
			console.log('User with id:  ' + id + ' is up to date')
		}
		else {
			console.log('update ' + id + ' success')
		}
		return responseSuccess({ ok: 1 })
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const getUserByFacebookId = async (facebookId) => {
	console.log('Try to find user with facebook id: ' + facebookId)
	try {
		const user = await accountModel.findOne({ facebookId: facebookId })
		if (!user) {
			console.log('User with facebook id: ' + facebookId + ' was not found')
			return null;
		}
		console.log('User with facebook id: ' + facebookId + ' found: ' + user)
		return user
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const getUserByIdToken = async (idToken) => {
	console.log('Try to find user with idToken: ' + idToken)
	try {
		const user = await accountModel.findOne({ idToken: idToken })
		if (!user) {
			console.log('User with idToken: ' + idToken + ' was not found')
			return null;
		}
		console.log('User with idToken: ' + idToken + ' found: ' + user)
		return user
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const getUserByFullName = async (fullName) => {
	console.log('Try to find user with fullName: ' + fullName)
	try {
		const user = await accountModel.findOne({ fullName: fullName })
		if (!user) {
			console.log('User with fullName: ' + fullName + ' was not found')
			return null;
		}
		console.log('User with fullName: ' + fullName + ' found: ' + user)
		return user
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const createAccount = async (data) => {
	console.log('Create user with this data: ' + JSON.stringify(data))
	try {
		const user = new accountModel({ ...data })
		await user.save()
		const res_statistics = await createAccountStatistics(user._id);
		const res_settings = await createAccountSettings(user._id);
		console.log('Success to create user: ' + user)
		return responseSuccess(user)
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const getUserlog = async (uid) => {
	console.log('Get user log')

	try {
		const user = await accountModel.findOne({ _id: uid })
		if (user) {
			console.log('User with id: ' + uid + ' was found ' + user);
			return responseSuccess(user);
		}
		else {
			return responseWrapper(404, { error: 'User with id: ' + uid + ' was not found' });
		}
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const notificationToken = async (data, id) => {
	console.log('Update user one signal id with id: ' + id + 'with this token: ' + JSON.stringify(data))
	try {
		const user = await accountModel.updateOne({ _id: id }, { $set: { oneSignalId: data } })
		if (user.n === 0) {
			console.log('user with id: ' + id + ' was not found')
			return responseWrapper(404, { error: 'user with id: ' + id + ' was not found' });
		}
		if (user.nModified === 0) {
			console.log('User with id:  ' + id + ' is up to date')
		}
		else {
			console.log('update ' + id + ' success')
		}
		return responseSuccess({ ok: 1 })
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}

export const getSettings = async (id) => {
	console.log('Try to find settings of user with id: ' + id);
	try {
		const settings = await accountSettingsModel.findOne({ userId: id })
		if (settings) {
			console.log('Settings with user id: ' + id + ' was found ' + settings);
			return responseSuccess({
				userTermsVersion: settings.termsVersion,
				termsVersion: 0 // TODO
			});
		}
		else {
			return responseWrapper(404, { error: 'Settings with user id: ' + id + ' was not found' });
		}
	} catch (err) {
		console.log(err.stack)
		return responseWrapper(500, { error: "Internal Server Error" });
	}
}