#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const program = require('commander');
const ora = require('ora');
const download = require('download-git-repo');
const mkdir = require('mkdirp');
const rm = require('rimraf').sync;
const inquirer = require('inquirer');
const chalk = require('chalk');
const rootPath = process.cwd();

program
  .version(require('../package').version)
  .option('-i, --init <name>', 'create a new project from a template')
  .option('-p, --page <name>', 'create a new page from a template')
  .option('-c, --component <name>', 'create a new component from a template')
  .option('-R, --remove-page [name]', 'remove one page or all, depends on the option name exists or not')
  .option('-r, --remove-component [name]', 'remove one component or all, depends on the option name exists or not')
  .parse(process.argv);

if (program.init) {
  initProject(program.init);
}

if (program.page) {
  create('views', program.page);
}

if (program.removePage) {
  remove('views', program.removePage);
}

if (program.component) {
  create('components', program.component);
}

if (program.removeComponent) {
  remove('components', program.removeComponent);
}

/**
 * create a new project
 * @param {String} name 
 */
function initProject(name) {
  if (!name) return;
  console.log(chalk.blue(`ready to create project: ${name}`));
  const projectPath = path.join(rootPath, name);
  if (fs.existsSync(projectPath)) {
    console.log(
      chalk.red(`project named ${name} has been existed, please use another project name`)
    );
    return;
  }
  const spinner = ora('downloading template');
  spinner.start();
  download('LuoHuacheng/wemp-template', projectPath, function(err) {
    spinner.stop();
    if (err) {
      console.log(chalk.red('Fail to download repo : ' + err.message.trim()));
    } else {
      console.log(chalk.green('mission completed !\n ') + `cd ${name} \n npm install \n npm run watch`);
    }
  });
}


/**
 * create a new page or component
 * @param {String} dir views or components
 * @param {String} name 
 */
function create(dir, name) {
  if (!name) return;
  const dirPath = path.join(rootPath, 'src', dir, name);
  if (fs.existsSync(dirPath)) {
    console.log(
      chalk.red(`file named ${name} has been existed, please use another file name`)
    );
    return;
  }
  mkdir(dirPath, function(err) {
    if (err) {
      console.log(chalk.red(`Fail to create new ${dir === 'views' ? 'page' : 'component'} : ` + err.message.trim()));
      return;
    } else {
      const extNames = ['styl', 'js', 'html', 'json'];
      extNames.forEach(item => {
        fs.writeFileSync(dirPath + '/' + name + '.' + item, loadTemplate(dir, item, { dir, name }));
      });
      console.log(chalk.green(`create ${dir === 'views' ? 'page' : 'component'} ${name} completed !`));
      if (dir === 'views') {
        handleAppJSON(name);
      }
    }
  });
}

/**
 * get templates
 * @param {String} dir views or components
 * @param {String} type file type(extended name)
 * @param {Object} options views or components's options
 */
function loadTemplate(dir, type, options) {
  return require(`../template/${dir}/${type}.js`)(options);
}

/**
 * remove a page or component
 * @param {String} dir views or components
 * @param {String} name 
 */
function remove(dir, name) {
  const dirPath = typeof name === 'boolean' ? path.join(rootPath, 'src', dir) : path.join(rootPath, 'src', dir, name);
  if (typeof name === 'boolean') {
    inquirer.prompt([{
      type: 'confirm',
      message: 'Do you want to remove the whole views folder ?',
      name: 'yes'
    }]).then(answers => {
      if (answers.yes) {
        rm(dirPath);
        console.log(chalk.green(`remove ${dir === 'views' ? 'page' : 'component'} ${typeof name === 'boolean' ? 'all' : name} completed !`));
        if (dir === 'views') {
          handleAppJSON(name, true);
        }
      }
    });
  } else {
    if (fs.existsSync(dirPath)) {
      rm(dirPath);
      console.log(chalk.green(`remove ${dir === 'views' ? 'page' : 'component'} ${name} completed !`));
      if (dir === 'views') {
        handleAppJSON(name, true);
      }
    } else {
      console.log(chalk.red(`${dirPath} does not exist !`));
    }
  }
}

/**
 * handle the pages in app.json file
 * @param {String} name 
 * @param {Boolean} remove 
 */
function handleAppJSON(name, remove = false) {
  const appFile = rootPath + '/src/app.json';
  const target = 'views/'+ name + '/' + name;
  fs.readFile(appFile, 'utf8', (err, data) => {
    if (err) {
      console.log(chalk.red(err.toString()));
      return;
    }
    const appJson = JSON.parse(data.toString());
    if (remove) {
      typeof name === 'boolean' ? appJson.pages = [] : appJson.pages.splice(target, 1);
    } else {
      appJson.pages.push(target);
    }
    fs.writeFile(appFile, JSON.stringify(appJson, null, 2), (err) => {
      if (err) {
        console.log(chalk.red(err.toString()));
        return;
      }
      console.log(chalk.green(`page ${name} has been ${remove ? 'removed from' : 'injected into'} app.json`));
    })
  });
} 
