import inquirer from 'inquirer';
import TOML from '@ltd/j-toml';
import fs from 'fs';
import path from 'path';

// The subjects folder is the main folder where all the subjects are stored
const subjectsFolder = './subjects';

// This function prompts the user to select a file or folder from the given directory
const selectFileOrFolder = (directory) => {
	return new Promise((resolve, reject) => {
		fs.readdir(directory, (err, entries) => {
			if (err) {
				reject(err);
				return;
			}

			// Add the "Go to parent folder" option to the list of choices
			const choices = [...entries, 'Go to parent folder'];

			inquirer.prompt([
				{
					type: 'list',
					name: 'selection',
					message: 'Select a file or folder:',
					choices: choices,
				},
			]).then(resolve);
		});
	});
};

// This function calls the selectFileOrFolder function and checks if the selected item is a file or a folder
const selectTomlFile = async (directory) => {
	try {
		// Display the list of entries to the user
		const { selection } = await selectFileOrFolder(directory);

		if (selection === 'Go to parent folder') {
			// If the user has selected the "Go to parent folder" option, get the parent folder's path and call the selectTomlFile function again with the parent folder's path
			const parentFolder = path.dirname(directory);
			return selectTomlFile(parentFolder);
		} else {
			// Get the full path to the selected entry
			const fullPath = path.join(directory, selection);

			// Check if the selected entry is a file or a folder
			const stat = await new Promise((resolve, reject) => {
				fs.stat(fullPath, (err, stat) => {
					if (err) {
						reject(err);
						return;
					}

					resolve(stat);
				});
			});

			if (stat.isDirectory()) {
				// If the selected entry is a folder, call the selectTomlFile function again with the path to the selected folder
				return selectTomlFile(fullPath);
			} else if (path.extname(selection) === '.toml') {
				// If the selected entry is a .toml file, return the path to the file
				return fullPath;
			} else {
				// If the selected entry is not a .toml file, display an error message and prompt the user to select a different file or folder
				console.error('Please select a .toml file.');
				return selectTomlFile(directory);
			}
		}
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

// The path to the TOML file
const filePath = await selectTomlFile(subjectsFolder);

// Read the TOML file
const toml = await new Promise((resolve, reject) => {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			reject(err);
			return;
		}

		resolve(data);
	});
});

// Parse the TOML file
const parsedToml = TOML.parse(toml);

// Ask the user for a definition
const askForDefinition = async () => {
	try {
		const { definition } = await inquirer.prompt([
			{
				type: 'input',
				name: 'definition',
				message: 'Enter a definition:',
			},
		]);

		// Get an array of all the keys in the parsedToml object
		const keys = Object.keys(parsedToml);

		// Find all keys that partially match the user's input
		const matchingKeys = keys.filter((key) => key.includes(definition));

		if (matchingKeys.length > 0) {
			console.log('Matching definitions:');
			matchingKeys.forEach((key) => {
				console.log(`- ${key}: ${parsedToml[key]}`);
			});

			// Prompt the user to ask for another definition or quit the program
			const { askAgain } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'askAgain',
					message: 'Do you want to ask for another definition?',
					default: true,
				},
			]);

			if (askAgain) {
				// If the user wants to ask for another definition, call the askForDefinition function again
				return askForDefinition();
			} else {
				// If the user doesn't want to ask for another definition, end the program
				console.log('Thank you for using the toml reader app. Goodbye!');
				process.exit(0);
			}
		} else {
			console.log('No matching definitions found. Please try again.');
			// Add a recursive call to askForDefinition here to prompt the user to try again
			return askForDefinition();
		}
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

// Call the askForDefinition function
await askForDefinition();