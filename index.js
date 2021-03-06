const express = require('express')
const cors = require('cors')
const app = express()
const port = 3667
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const execSync = require('child_process').execSync;
const version = VERSION = require('./package.json').version + '@' + execSync('git show -s --format=%h').toString().trim()

const dataStore = require('./jsonDataStore')
const auth = require('./auth')

app.use(cors());

app.get('/', (req, res) => {
	res.send('Welcome to ddl manager API!')
})

app.get('/api/system', (req, res)=>{
	res.send({
		version
	})
})

app.use(auth.authVerify)//the methods below need auth

app.get('/api/all', (req, res) => {
	var tasks = [...dataStore.getAll()]
	var user=auth.getUserByToken(req.headers['x-auth'])
	tasks.forEach(i => {
		if (i.status && i.status[user.uid]) {
			i.done = true
		}
	});
	res.send(tasks)
})

app.get('/api/item/:id', (req, res) => {
	const result = dataStore.getById(req.params.id)
	if (result == null) {
		res.status(404).send({ code: 404 })
		return
	}
	res.send(result)
})

app.put('/api/item/:id', jsonParser, (req, res) => {
	const result = dataStore.modify(req.params.id, req.body)
	res.status(result).send({ code: result })
})

app.delete('/api/item/:id', (req, res) => {
	const result = dataStore.remove(req.params.id)
	res.status(result).send({ code: result })
})

app.post('/api/add', jsonParser, (req, res) => {
	const result = dataStore.add(req.body)
	res.status(result).send({ code: result })
})

app.post('/api/status/:id', jsonParser, (req, res) => {
	if (req.body.status == null) {
		res.status(400).send({ code: 400 })
		return
	}
	const user = auth.getUserByToken(req.headers['x-auth'])
	const result = dataStore.setStatus(req.params.id, user.uid, req.body.status)
	res.status(result).send({ code: result })
})

app.post('/api/bot/resetToken', jsonParser, (req, res) => {
	const token = req.headers['x-auth']
	const uid = req.body.uid
	const opter = auth.getUserByToken(token)
	if (opter.auth != auth.bot) {
		res.status(403).send({ code: 403 })
		return
	}
	if (!uid) {
		res.status(400).send({ code: 400 })
		return
	}
	const newToken = auth.resetUserToken(uid)
	res.status(200).send({
		code: 200,
		token: newToken
	})
})

app.post('/api/bot/status/:id', jsonParser, (req, res) => {
	const token = req.headers['x-auth']
	const uid = req.body.uid
	const opter = auth.getUserByToken(token)
	if (opter.auth != auth.bot) {
		res.status(403).send({ code: 403 })
		return
	}
	if (!uid || !req.body.status) {
		res.status(400).send({ code: 400 })
		return
	}
	const result = dataStore.setStatus(req.params.id, uid, req.body.status)
	res.status(result).send({ code: result })
})

app.get('/api/user/me', (req, res) => {
	const token = req.headers['x-auth']
	res.send(auth.getUserByToken(token))
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})