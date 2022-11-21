const chalk = require('chalk');

/** Custom Logging Method */
class Logging {
  constructor() {}

  static log = (args) => this.info(args);

  static info = (args) =>
    console.log(
      chalk.blue(`[${new Date().toLocaleString()}] [INFO]`),
      typeof args === 'string' ? chalk.blueBright(args) : args
    );

  static warn = (args) =>
    console.log(
      chalk.yellow(`[${new Date().toLocaleString()}] [WARN]`),
      typeof args === 'string' ? chalk.yellowBright(args) : args
    );

  static error = (args) =>
    console.log(
      chalk.red(`[${new Date().toLocaleString()}] [ERROR]`),
      typeof args === 'string' ? chalk.redBright(args) : args
    );
}

module.exports = Logging;
