export function preprocessSchemaBindings(schema, loanName) {
	function processItem(item) {
		if (item.bindsTo_template) {
			item.bindsTo = item.bindsTo_template.replace('{loanName}', loanName);
			delete item.bindsTo_template;
		}
		if (item.questions) {
			item.questions = item.questions.map(processItem);
		}
		if (item.items) {
			item.items = item.items.map(processItem);
		}
		return item;
	}

	const newSchema = { ...schema };
	if (Array.isArray(newSchema.pages)) {
		newSchema.pages = newSchema.pages.map((page) => processItem(page));
	}
	return newSchema;
}
