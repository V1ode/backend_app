require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const sequelize = require('./db');
const models = require("./models");
const router = require("./routes/index");
const path = require("path");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(fileUpload({}));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "static")));
app.use('/api', router);

app.use(errorHandler);

const start = async () => {
    try{
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => console.log(`Server is running on port: http://localhost:${PORT}`));
    } catch (e) {
        console.log(e);
    }
}


app.get('/', (req, res) => {
    res.send("Hello");
})


start();
