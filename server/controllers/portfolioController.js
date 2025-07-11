const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Portfolio, Teg, Project, PortfolioTeg } = require("../models");
const { where, Op } = require("sequelize");
const nodemailer = require("nodemailer");


class PortfolioController {
    async createPortfolio(req, res, next) {
        const { userId, salary, tegs, description } = req.body;
        if (!userId || !salary || !tegs || !description) {
            return next(ApiError.badRequest("Не все поля заполнены (userId, salary, tegs (массив тегов), description)"));
        }

        let portfolio;
        try {
            portfolio = await Portfolio.create({userId, salary, tegs_id: tegs, description});

            let portfolioTeg;
            for (const teg_id of tegs) {
                portfolioTeg = await PortfolioTeg.create({portfolioId: portfolio.id, tegId: teg_id});
            }

            return res.json({ portfolio });
        } catch (error) {
            console.error("Ошибка при создании портфолио:", error);
            return next(ApiError.internal("Не удалось создать портфолио"));
        }
    }

    async updatePortfolio(req, res, next) {
        const { id, userId, salary, tegs, description } = req.body;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID портфолио для обновления"));
        }

        try {
            const portfolio = await Portfolio.findByPk(id);
            if (!portfolio) {
                return next(ApiError.notFound("Портфолио не найдено"));
            }

            const updatedPortfolio = await Portfolio.update(
                {userId, salary, tegs_id: tegs, description},
                {where: {id}}
            );

            return res.json({ updatedPortfolio });
        } catch (error) {
            console.error("Ошибка при обновлении портфолио:", error);
            return next(ApiError.internal("Не удалось обновить портфолио"));
        }
    }

    async deletePortfolio(req, res, next) {
        const {id} = req.params;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID портфолио для удаления"));
        }

        try {
            const portfolio = await Portfolio.findByPk(id);
            if (!portfolio) {
                return next(ApiError.notFound("Портфолио не найдено"));
            }

            await Portfolio.destroy({ where: { id } });
            return res.json({ message: "Портфолио успешно удалено" });
        } catch (error) {
            console.error("Ошибка при удалении портфолио:", error);
            return next(ApiError.internal("Не удалось удалить портфолио"));
        }
    }

    async getAllPortfolio(req, res, next) {
        const {id, userId, min_salary, max_salary, tegs, name } = req.body;
        let { limit, page } = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        if (userId) whereConditions.userId = {[Op.overlap]: userId};

        if (min_salary) whereConditions.min_salary = {[Op.gte]: min_salary};

        if (max_salary) whereConditions.max_salary = {...whereConditions.salary, [Op.lte]: max_salary};

        if (tegs && tegs.length > 0) whereConditions.tegs_id = {[Op.overlap]: tegs};

        if (name) whereConditions.name = {[Op.overlap]: name};

        console.log("Условия запроса:", whereConditions);

        try {
            const portfolios = await Portfolio.findAll({ where: whereConditions, limit, offset });
            return res.json(portfolios);
        } catch (error) {
            console.error("Ошибка при получении портфолио:", error);
            return next(ApiError.internal("Не удалось получить портфолио"));
        }
    }

    async getOnePortfolio(req, res, next) {
        const {id} = req.body;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID портфолио для удаления"));
        }
        const portfolio = await Portfolio.findOne({ where: id });

        return res.json({portfolio});
    }


    async createTeg(req, res, next) {
        const {name} = req.body;
        if(!name) return ApiError.badRequest("Укажите название тега");
        const teg = await Teg.create({name});
        
        return res.json({teg});
    }

    async updateTeg(req, res, next) {
        const { id, name } = req.body;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID тега для обновления"));
        }

        try {
            const teg = await Teg.findByPk(id);
            if (!teg) {
                return next(ApiError.notFound("Тег не найден"));
            }

            const updatedTeg = await Teg.update(
                {name},
                {where: {id}}
            );

            return res.json({ updatedTeg });
        } catch (error) {
            console.error("Ошибка при обновлении тега:", error);
            return next(ApiError.internal("Не удалось обновить тег"));
        }
    }

    async deleteTeg(req, res, next) {
        const {id} = req.params;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID тега для удаления"));
        }

        try {
            const teg = await Teg.findByPk(id);
            if (!teg) {
                return next(ApiError.notFound("Тег не найден"));
            }

            await Teg.destroy({ where: {id} });
            return res.json({ message: "Тег успешно удален" });
        } catch (error) {
            console.error("Ошибка при удалении тега:", error);
            return next(ApiError.internal("Не удалось удалить тег"));
        }
    }

    async getAllTegs(req, res, next) {
        const {id, name} = req.body;
        let { limit, page } = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        if (name) whereConditions.name = {[Op.overlap]: name};

        console.log("Условия запроса:", whereConditions);
        
        try {
            const tegs = await Teg.findAll({ where: whereConditions, limit, offset });
            return res.json(tegs);
        } catch (error) {
            console.error("Ошибка при получении тегов:", error);
            return next(ApiError.internal("Не удалось теги"));
        }
    }


    async createProject(req, res, next) {
        const {name, description, link} = req.body;
        const {images} = req.files;
        let fileNames = [];

        if(!name) return ApiError.badRequest("Не все поля заполнены");

        if(images) {
            try {
                for (let i = 0; i < images.length; i++) {
                    fileNames.push(uuid.v4() + ".jpg");
                    images[i].mv(path.resolve(__dirname, "..", "static", fileNames[i]));
                }
            } catch (error) {
                console.error("Ошибка при удалении тега:", error);
                next(ApiError.internal("Не получить список картинок"));
            }
        }
            

        const proj = await Project.create({name, description, images: fileNames, link});

        return res.json({proj});
    }


    async updateProject(req, res, next) {
        const {id, name, description, images, link} = req.body;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID проекта для обновления"));
        }

        try {
            const project = await Project.findByPk(id);
            if (!project) {
                return next(ApiError.notFound("Проект не найден"));
            }

            const updatedProject = await Project.update(
                { name, description, images, link },
                { where: { id } }
            );

            return res.json({ updatedProject });
        } catch (error) {
            console.error("Ошибка при обновлении проекта:", error);
            return next(ApiError.internal("Не удалось обновить проект"));
        }
    }

    async deleteProject(req, res, next) {
        const {id} = req.params;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID проекта для удаления"));
        }

        try {
            const project = await Project.findByPk(id);
            if (!project) {
                return next(ApiError.notFound("Проект не найден"));
            }

            await Project.destroy({ where: {id} });
            return res.json({ message: "Проект успешно удален" });
        } catch (error) {
            console.error("Ошибка при удалении проекта:", error);
            return next(ApiError.internal("Не удалось удалить проект"));
        }
    }


    async getAllProjects(req, res, next) {
        let {id, name, description, link, limit, page} = req.body;

        limit = limit || 4;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        if (name) whereConditions.name = {[Op.overlap]: name};

        if (description) whereConditions.description = {[Op.overlap]: description};

        if (link) whereConditions.link = {[Op.overlap]: link};

        console.log("Условия запроса:", whereConditions);

        try {
            const projects = await Project.findAll({where: {whereConditions, limit, offset}});
            return res.json(projects);
        } catch (error) {
            console.error("Ошибка при получении проектов:", error);
            return next(ApiError.internal("Не удалось получить проекты"));
        }
    }
    
    async getAllProjectsById(req, res, next) {
        let {ids} = req.body;

        let projects = [];
        for (let i = 0; i < ids.length; i++) projects.push(await Project.findAll({id: ids[i]}));

        return res.json(projects);
    }

    async postMailMassage(req, res, next) {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return next(ApiError.badRequest("Все поля (userId, title, message) должны быть заполнены"));
        }

        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.notFound("Пользователь не найден"));
            }

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.MY_MAIL_LOGIN, // email
                    pass: process.env.MY_MAIL_PASSWORD, // пароль
                },
            });

            const mailOptions = {
                from: "your-email@example.com", // От кого
                to: user.email, // Кому
                subject: "Вам пришёл ответ от работодателя", // Тема письма
                text: message, // Текст письма
            };

            await transporter.sendMail(mailOptions);
            return res.json({ message: "Письмо успешно отправлено" });

        } catch (error) {
            console.error("Ошибка при отправке письма:", error);
            return next(ApiError.internal("Не удалось отправить письмо"));
        }
    }

    // само портфолио данного пользователя
    // имена teg данного портфолио
    // данные user карты
    // количество проектов
    async getPortfolioCard(req, res, next) {
        try {
            const portfolios = await Portfolio.findAll();
            
            const userIds = portfolios.map(p => p.userId);
            const tegIds = [...new Set(portfolios.flatMap(p => p.tegs_id || []))];

            const users = await User.findAll({ 
                where: { id: userIds } 
            });
            const tegs = await Teg.findAll({ 
                where: { id: tegIds } 
            });

            const userMap = users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});

            const tegMap = tegs.reduce((acc, teg) => {
                acc[teg.id] = teg.name;
                return acc;
            }, {});

            const tegsArray = portfolios.map(portfolio => 
                (portfolio.tegs_id || []).map(id => tegMap[id]).filter(Boolean)
            );

            const usersArray = portfolios.map(portfolio => userMap[portfolio.userId]);

            return res.json({
                portfolios,
                users: usersArray,
                tegs: tegsArray
            });
        } catch (error) {
            console.error("Ошибка при получении карточек портфолио:", error);
            return next(ApiError.internal("Не удалось получить карточки портфолио"));
        }
    }

}

module.exports = new PortfolioController()