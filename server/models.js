const sequelize = require('./db')
const {DataTypes} = require('sequelize');

const User = sequelize.define("user", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, unique: true, allowNull: false},
    login: {type: DataTypes.STRING, unique: true, allowNull: false},
    password: {type: DataTypes.STRING, unique: true, allowNull: false},
    role: {type: DataTypes.STRING, defaultValue: "guest", allowNull: false},
    image: {type: DataTypes.STRING}
})

const Teg = sequelize.define("teg", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false, unique: true},
})

const Project = sequelize.define("project", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    description: {type: DataTypes.TEXT},
    images: {type: DataTypes.ARRAY(DataTypes.STRING)},
    link: {type: DataTypes.STRING}
})

const Portfolio = sequelize.define("portfolio", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
    salary: { type: DataTypes.INTEGER },
    tegs_id: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    projects_id: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    description: { type: DataTypes.TEXT },
});

const WebsiteMail = sequelize.define("WebsiteMail", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstUserId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
    secondUserId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
    title: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT },
    viewed: {type: DataTypes.BOOLEAN, defaultValue: false},
});

const ChatMessage = sequelize.define("chatMessage", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
    message: { type: DataTypes.TEXT },
    viewed: {type: DataTypes.BOOLEAN, defaultValue: false},
})

const Chat = sequelize.define("chat", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usersID: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
    },
    chatMessagesId: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
    }
})


const PortfolioTeg = sequelize.define('PortfolioTeg', {});
const PortfolioProject = sequelize.define('PortfolioProject', {});

Portfolio.belongsToMany(Teg, { through: PortfolioTeg });
Teg.belongsToMany(Portfolio, { through: PortfolioTeg });

Portfolio.belongsToMany(Project, { through: PortfolioProject });
Project.belongsToMany(Portfolio, { through: PortfolioProject });

WebsiteMail.belongsTo(User, { foreignKey: 'firstUserId', as: 'firstUser' });
WebsiteMail.belongsTo(User, { foreignKey: 'secondUserId', as: 'secondUser' });

Chat.belongsToMany(User, { through: 'ChatUsers', foreignKey: 'chatId' });
User.belongsToMany(Chat, { through: 'ChatUsers', foreignKey: 'userId' });

Chat.hasMany(ChatMessage, { foreignKey: 'chatId' });
ChatMessage.belongsTo(Chat, { foreignKey: 'chatId' });

ChatMessage.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Teg,
    Project,
    Portfolio,
    PortfolioTeg,
    PortfolioProject,
    WebsiteMail,
    Chat,
    ChatMessage
}
