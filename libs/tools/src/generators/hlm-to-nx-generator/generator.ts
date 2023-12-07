import { names, ProjectConfiguration, readJson, Tree, workspaceRoot } from '@nx/devkit';
import * as path from 'path';
import { addPrimitiveToSupportedUILibraries } from './lib/add-primitive-to-supported-ui-libraries';
import { copyFilesFromHlmLibToGenerator, createSharedGeneratorFiles, recursivelyDelete } from './lib/file-management';
import { getProjectsAndNames } from './lib/get-project-names';
import { HlmToNxGeneratorGeneratorSchema } from './schema';

async function createGeneratorFromHlmLibrary(
	projects: Map<string, ProjectConfiguration>,
	generatorName: string,
	internalName: string,
	tree: Tree,
	options: HlmToNxGeneratorGeneratorSchema,
) {
	const srcPath = path.join(workspaceRoot, projects.get(internalName).sourceRoot);
	const projectRoot = `libs/nx/src/generators/ui/libs/${internalName}`;
	const filesPath = path.join(projectRoot, 'files');
	const peerDependencies = readJson(tree, path.join(projects.get(internalName).root, 'package.json'))[
		'peerDependencies'
	];
	recursivelyDelete(tree, filesPath);
	addPrimitiveToSupportedUILibraries(tree, generatorName, internalName, peerDependencies);
	copyFilesFromHlmLibToGenerator(tree, srcPath, filesPath, options);
	createSharedGeneratorFiles(tree, projectRoot, options);
}

export async function hlmToNxGeneratorGenerator(tree: Tree, options: HlmToNxGeneratorGeneratorSchema) {
	const { projects, projectNames } = getProjectsAndNames(tree);
	const projectNamesIgnoringCoreLibs = projectNames.filter((name) => !name.includes('core'));

	projectNamesIgnoringCoreLibs.forEach((internalName) => {
		const primitiveName = internalName.replace('ui-', '').replace('-helm', '').replace('-', '');
		const cleanNames = names(primitiveName);
		options = { ...options, ...cleanNames };
		options['internalName'] = internalName;
		options['publicName'] = 'ui-' + primitiveName + '-helm';
		options['primitiveName'] = primitiveName;

		createGeneratorFromHlmLibrary(projects, primitiveName, internalName, tree, options);
	});
}

export default hlmToNxGeneratorGenerator;
