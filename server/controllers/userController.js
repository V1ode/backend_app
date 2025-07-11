const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const path = require("path");
const { User, Portfolio, Teg, Project } = require("../models");

const generateJWT = (id, name, email, login, role) => {
    return jwt.sign({id, name, email, login, role}, process.env.SECRET_KEY, {expiresIn: "24h"})
}

class UserController {
    async registration(req, res, next) {
        let {role} = req.body;
        const {name, email, login, password} = req.body;
        if(!name || !email || !login || !password) return next(ApiError.unauthorized("Некоректные данные ввода при авторизации"));
        role = role || "guest";

        let candidate = await User.findOne({where: {login}});
        if(candidate) return next(ApiError.badRequest("Пользователь с таким login уже существует"));
        candidate = await User.findOne({where: {email}});
        if(candidate) return next(ApiError.badRequest("Пользователь с таким email уже существует"));
        
        const hashPassword = await bcrypt.hash(password, 2);
        const user = await User.create({name, email, login, password: hashPassword, role});

        const token = generateJWT(user.id, name, email, login, role);

        return res.json({token});
    }

    async login(req, res, next) {
        const {name, email, login, password} = req.body;
        let user = await User.findOne({where: {email, login}})
        if(!user) return next(ApiError.internal("Пользователь не найден"));

        let comparePassword = bcrypt.compareSync(password, user.password);
        if(!comparePassword) return next(ApiError.internal("Указан неверный пароль"));

        const token = generateJWT(user.id, name, user.email, user.login, user.role)

        return res.json({token});
    }

    async update(req, res, next) {
        const {id, name, email, login, password} = req.body;
        const {image} = req.files;
        try {
            if(image) {
                let fileName = uuid.v4() + ".jpg";
                image.mv(path.resolve(__dirname, "..", "static", fileName));
            }
        } catch (e) {
            return next(ApiError.internal("Не получилось дрбавить картинку"));
        }

        const userObj = await User.update({name, email, login, password, image}, {where: {id}});

        const token = generateJWT(userObj.id, userObj.email, userObj.login, userObj.image);

        return res.json({token});
    }

    async getAll(req, res, next) {
        try {
            const users = await User.findAll({});
            return res.json({users});
        } catch (error) {
            console.error(error);
            return next(ApiError.internal("Не получилось передать данные о пользователях"));
        }
    }

    async check(req, res, next) {
        const {name, email, login, password} = req.body;
        let user = await User.findOne({where: {email, login}})
        if(!user) return next(ApiError.notFound("Пользователь не найден"));

        let comparePassword = bcrypt.compareSync(password, user.password);
        if(!comparePassword) return next(ApiError.unauthorized("Указан неверный пароль"));

        const token = generateJWT(user.id, name, user.email, user.login, user.role)

        return res.json({token});
    }

    async getOne(req, res, next) {
        const {id} = req.body;

        candidate = await User.findOne({where: {id}});

        return res.json({candidate})
    }

    async getUserProfile(req, res, next) {
        const { id } = req.body;

        try {
            const candidate = await User.findOne({ where: { id } });
            if (!candidate) return next(ApiError.notFound("Пользователь не найден"));

            const portfolios = await Portfolio.findAll({ where: { userId: id } });

            const tegsIds = portfolios.flatMap(portfolio => portfolio.tegs_id || []);
            const projectsIds = portfolios.flatMap(portfolio => portfolio.projects_id || []);

            const tegs = await Teg.findAll({ where: { id: tegsIds } });

            const projects = await Project.findAll({ where: { id: projectsIds } });

            return res.json({ user: candidate, tegs: tegs.map(teg => teg.name), projects });
        } catch (error) {
            console.error(error);
            return next(ApiError.internal("Не удалось получить данные профиля пользователя"));
        }
    }

}

module.exports = new UserController()