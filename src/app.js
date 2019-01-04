import express from 'express';
import path from 'path';
import exphbs from 'express-handlebars';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import expressValidator from 'express-validator';
import BugsnagHelper from './helpers/bugsnagHelper';
import MonthlyReportSender from './helpers/email/monthlyReportSender';
import modules from './modules';
import SlackBodyParserFilter from './helpers/slackBodyParserFilter';
import './modules/slack/events/index';

dotenv.config();

const app = express();

/* This must be the first piece of middleware in the stack.
   It can only capture errors in downstream middleware */
BugsnagHelper.init(app);

app.use(cors());
app.use(morgan('dev'));

app.use(SlackBodyParserFilter.maybe(
  express.urlencoded({
    limit: '50mb',
    extended: true
  })
));
app.use(SlackBodyParserFilter.maybe(express.json()));

app.use(expressValidator());

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.set('views', path.join(__dirname, 'views'));

const hbs = exphbs.create({
  defaultLayout: '_layout.html',
  baseTemplates: app.get('views'),
  layoutsDir: `${app.get('views')}/layouts`,
  partialsDir: [`${app.get('views')}/partials`]
});

app.engine('html', hbs.engine);
app.set('view engine', 'html');

// set base url for api
modules(app, hbs);

// catch all routers
app.use('*', (req, res) => res.status(404).json({
  message: 'Not Found. Use /api/v1 to access the api'
}));

MonthlyReportSender.scheduleReporting(app);

/* This handles any errors that Express catches,
   it should come last in the pipeline */
BugsnagHelper.errorHandler(app);

export default app;
