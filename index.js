import inquirer from 'inquirer';
import fs from 'fs';

// create a list of all the subjects from the folders inside the subjects folder
const subjects = fs.readdirSync('./subjects');

// log the subjects to the console (json stringified)
console.log(JSON.stringify(subjects, null, 2));