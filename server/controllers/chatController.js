const ApiError = require("../error/ApiError");
const { User, WebsiteMail, Chat, ChatMessage, Portfolio, Teg } = require("../models");
const { Op } = require("sequelize");

class ChatController {
    async createWebsiteMail(req, res, next) {
        const {firstUserId, secondUserId, title, message} = req.body;

        if (!firstUserId || !secondUserId || !title || !message) {
            return next(ApiError.badRequest("Не все поля заполнены (firstUserId, secondUserId, title, message)"));
        }

        try {
            const mail = await WebsiteMail.create({firstUserId, secondUserId, title, message});
            return res.json({ mail });
        } catch (error) {
            console.error("Ошибка при создании websiteMail-письма:", error);
            return next(ApiError.internal("Не удалось создать email-письмо"));
        }
    }

    async updateWebsiteMail(req, res, next) {
        const {id, title, message, viewed} = req.body;

        if (!id) {
            return next(ApiError.badRequest("Не указан ID websiteMail-письма для обновления"));
        }

        try {
            const mail = await WebsiteMail.findByPk(id);
            if (!mail) return next(ApiError.notFound("WebsiteMail-письмо не найдено"));

            await WebsiteMail.update({title, message, viewed}, {where: {id}});
            return res.json({message: "Email-письмо обновлено"});
        } catch (error) {
            console.error("Ошибка при обновлении email-письма:", error);
            return next(ApiError.internal("Не удалось обновить websiteMail-письмо"));
        }
    }

    async getAllWebsiteMails(req, res, next) {      
        const {id, firstUserId, secondUserId, title, message, viewed} = req.body;
        let {limit, page} = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        if (firstUserId) whereConditions.firstUserId = {[Op.overlap]: firstUserId};

        if (secondUserId) whereConditions.secondUserId = {[Op.overlap]: secondUserId};

        if (title) whereConditions.title = {[Op.overlap]: title};

        if (message) whereConditions.message = {[Op.overlap]: message};

        if (viewed) whereConditions.viewed = {[Op.overlap]: viewed};

        console.log("Условия запроса:", whereConditions);
        
        try {
            const mails = await WebsiteMail.findAll({ where: whereConditions, limit, offset });
            return res.json(mails);
        } catch (error) {
            console.error("Ошибка при получении email-писем:", error);
            return next(ApiError.internal("Не удалось получить websiteMail-письма"));
        }
    }

    // само портфолио данного пользователя
    // имена teg данного портфолио
    // данные user карты
    // количество проектов
    async getPortfolioCard(req, res, next) {
        let {limit, page} = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        const portfolios = await Portfolio.findAll();
        const users = [];
        const tegs = [];

        for (let i = 0; i < portfolios.length; i++) {
            tegs[i] = [];
            for (let j = 0; j < portfolios[i].tegs_id.length; j++) {
                let teg = await Teg.findOne({where: {id: portfolios[i].tegs_id[j]}});
                tegs[i][j] = teg.name;
            }

            users.push(await User.findOne({where: {id: portfolios[i].userId}}));
        }

        return res.json({portfolios, users, tegs});
    }

    async createChat(req, res, next) {
        const { usersID } = req.body;

        if (!usersID || usersID.length === 0) {
            return next(ApiError.badRequest("Не указаны пользователи для создания чата"));
        }

        try {
            const chat = await Chat.create({usersID});
            return res.json({chat});
        } catch (error) {
            console.error("Ошибка при создании чата:", error);
            return next(ApiError.internal("Не удалось создать чат"));
        }
    }

    async updateChat(req, res, next) {
        const {id, usersID} = req.body;

        if (!id) return next(ApiError.badRequest("Не указан ID чата для обновления"));

        try {
            const chat = await Chat.findByPk(id);
            if (!chat) return next(ApiError.notFound("Чат не найден"));

            await Chat.update({usersID}, {where: {id}});
            return res.json({message: "Чат обновлен"});
        } catch (error) {
            console.error("Ошибка при обновлении чата:", error);
            return next(ApiError.internal("Не удалось обновить чат"));
        }
    }

    async getAllChats(req, res, next) {
        const {id} = req.body;
        let {limit, page} = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        console.log("Условия запроса:", whereConditions);
        
        try {
            const chats = await Chat.findAll({ where: whereConditions, limit, offset });
            return res.json(chats);
        } catch (error) {
            console.error("Ошибка при получении чатов:", error);
            return next(ApiError.internal("Не удалось получить чаты"));
        }
    }
    

    async createChatMessage(req, res, next) {
        const {chatId, userId, message} = req.body;

        if (!chatId || !userId || !message) {
            return next(ApiError.badRequest("Не все поля заполнены (chatId, userId, message)"));
        }

        try {
            const chatMessage = await ChatMessage.create({chatId, userId, message});

            const chat = await Chat.findByPk(chatId);
            if (!chat) {
                return next(ApiError.notFound("Чат не найден"));
            }

            const updatedChatMessagesId = [...chat.chatMessagesId, chatMessage.id];

            await Chat.update({chatMessagesId: updatedChatMessagesId }, { where: { id: chatId }});

            return res.json({chatMessage});
        } catch (error) {
            console.error("Ошибка при создании сообщения в чате:", error);
            return next(ApiError.internal("Не удалось создать сообщение в чате"));
        }
    }


    async updateChatMessage(req, res, next) {
        const {id, message, viewed} = req.body;

        if (!id) return next(ApiError.badRequest("Не указан ID сообщения для обновления"));

        try {
            const messageObj = await ChatMessage.findByPk(id);
            if (!messageObj) {
                return next(ApiError.notFound("Сообщение не найдено"));
            }

            await ChatMessage.update({message, viewed}, {where: {id}});
            return res.json({message: "Сообщение обновлено"});
        } catch (error) {
            console.error("Ошибка при обновлении сообщения в чате:", error);
            return next(ApiError.internal("Не удалось обновить сообщение в чате"));
        }
    }

    async getAllChatMessages(req, res, next) {
        const {id, userId, message, viewed} = req.body;
        let {limit, page} = req.body;

        limit = limit || 9;
        page = page || 1;
        const offset = (page - 1) * limit;

        let whereConditions = {};

        if (id) whereConditions.id = {[Op.overlap]: id};

        if (userId) whereConditions.userId = {[Op.overlap]: userId};

        if (message) whereConditions.message = {[Op.overlap]: message};

        if (viewed) whereConditions.viewed = {[Op.overlap]: viewed};

        console.log("Условия запроса:", whereConditions);
        
        try {
            const chats = await Chat.findAll({ where: whereConditions, limit, offset });
            return res.json(chats);
        } catch (error) {
            console.error("Ошибка при получении сообщений чатов:", error);
            return next(ApiError.internal("Не удалось сообщения чатов"));
        }
    }

}

module.exports = new ChatController();
