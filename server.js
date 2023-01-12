const express = require("express");
const apiRoutes = require("./routers/app.routers");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const envConfig = require("./config")
const passport = require('./middlewares/passport.js');
const dbConfig = require('./db/config');
const cluster = require("cluster");
const os = require("os");
const {
    logger,
    consoleLogger,
} = require("./logger/logger")




const minimist = require("minimist")
const args = minimist(process.argv.slice(2), {
    default: {
        port: 8080,
    },
    alias: {
        p: "port",
    }    
});
const PORT = args.port;
const clusterMode = process.argv[4] == "CLUSTER";

const app = express();


// Middlewares
/* app.use(express.static("./public")); */
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use(session({
    name: 'my-session',
    secret: 'top-secret-51',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
        mongoUrl: dbConfig.mongodb.connectTo("DesafioInicioSesion")
    }),
    cookie: {
        maxAge: 60000
    }
}));

app.use(passport.initialize())
app.use(passport.session())


app.set('views', './views');
app.set('view engine', 'ejs');

// Routes
app.get('/datos', async (req, res) => {
    consoleLogger.info("peticion a /datos, metodo get")
    const html = `Puerto: ${PORT}`
    res.send(html)
});

app.use("/", apiRoutes);




if (!clusterMode){
    consoleLogger.info("Modo Fork");
}

if (clusterMode && cluster.isPrimary) {
    consoleLogger.info("Modo Cluster");
    const NUM_WORKERS = os.cpus().length;
    for (let i = 0; i < NUM_WORKERS; i++){
        cluster.fork();
    }
    cluster.on("exit", worker => {
        consoleLogger("Worker", worker.process.pid, "died", new Date().toLocaleDateString())
    })
    cluster.fork()
} else {
    app.listen(PORT, () => {
        logger.trace(`Servidor escuchando en http://${envConfig.HOST}:${PORT}`)
    });
}



