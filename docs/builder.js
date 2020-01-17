class TastyBuilder {
    /**
     * @type {HTMLElement}
     */
    _canvasContainer;

    /**
     * @type {tasty.menu}
     */
    _menu;

    /**
     * Initial Menu Structure
     *
     * @type {Object}
     */
    _structure = {
        id: 'root',
        direction: 0,
        text: 'Main Menu',
        icon: 'bars',
        children: []
    };

    /**
     * jsoneditor instance
     */
    _editor;

    /**
     * @type {HTMLElement}
     */
    _editorContainer;

    /**
     * Flag if json schema is valid for tasty.js
     *
     * @type {boolean}
     * @private
     */
    _isValidJson = false;

    /**
     * Update BTN
     *
     * @type {HTMLElement}
     */
    _updateBtn;

    constructor() {
        this._canvasContainer = document.getElementById('canvas');
        this._editorContainer = document.getElementById('output');

        this._updateBtn = document.getElementById('update');

        this._initMenu();
        this._initEditor();
        this._displayMenu();

        this._updateBtn.addEventListener('click', () => {
            if (!this._checkStruct(this._editor.get())) {
                return;
            }

            if (!this._isValidJson) {
                warn.textContent = 'JSON is not valid.';
                return false;
            }

            this._structure = this._editor.get();

            document.getElementById('jsonOutput').value = JSON.stringify(this._editor.get());
            this._displayMenu();
        });

        document.getElementById('load').addEventListener('click', () => {
            const fromJson = JSON.parse(document.getElementById('jsonOutput').value);
            if (fromJson !== '') {
                this._editor.set(fromJson);

                if (!this._checkStruct(fromJson)) {
                    return;
                }

                this._structure = this._editor.get();
                this._displayMenu();
            }
        });
    }

    /**
     * Initializes tasty.js
     *
     * @private
     */
    _initMenu() {
        this._menu = new tasty.menu('#canvas' /* The element to place the menu into */, {
            // Configuration object
            // These are the defaults
            main: {
                minDistance: 150,
                minTraceDistance: 175,
                animationDuration: 250,
                enableMaxClickRadius: false,
            },
        });

        this._menu.init();
    }

    /**
     * Initializes the JSON Editor
     *
     * @private
     */
    _initEditor() {
        const schema = {
            "$id": "action",
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Action",
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "Root id.",
                    "minLength": 1,
                },
                "text": {
                    "type": "string",
                    "description": "Text visible on start.",
                    "minLength": 1,
                },
                "icon": {
                    "type": "string",
                    "description": "Font Awesome Icon Name without 'fa'.",
                    "minLength": 1,
                },
                "direction": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 0,
                },
                "children": {
                    "type": "array",
                    "description": "Zero or more Menu Items / Slider / Checkboxes / RadioGroups.",
                    "items": {
                        "$ref": "item"
                    }
                }
            },
            "required": [
                "id", "text", "icon", "direction"
            ]
        };

        const item = {
            "title": "Action",
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "Unique item id. Used as identifier in menu events.",
                    "minLength": 1,
                },
                "text": {
                    "type": "string",
                    "description": "Text visible on hover in parent menu.",
                    "minLength": 1,
                },
                "icon": {
                    "type": "string",
                    "description": "Font Awesome Icon Name without 'fa'. Optional.",
                },
                "direction": {
                    "type": "integer",
                    "description": "Item angle in parent menu. Between 0 - 360. 0 = North, 90 East, ...",
                    "minimum": 0,
                    "maximum": 360,
                },
                "children": {
                    "type": "array",
                    "description": "Zero or more Menu Items / Slider / Checkboxes.",
                    "items": {
                        "$ref": "item"
                    }
                },
                "data": {
                    "type": "object",
                    "description": "Item configuration",
                    "properties": {
                        // Only Checkbox
                        "selected": {
                            "type": "boolean",
                            "description": "Sets the initial checkbox state to selected."
                        },
                        // Slider
                        "min": {
                            "type": "number",
                            "description": "Slider min. value. MUST be smaller than max.",
                        },
                        "max": {
                            "type": "number",
                            "description": "Slider max. value. MUST be greater than min.",
                        },
                        "initial": {
                            "type": "number",
                            "description": "Initial slider value. MUST NOT be outside the min/max range.",
                        },
                        "stepSize": {
                            "type": "number",
                            "description": "Size between steps. E.g.: 2 = | -2 .. 0 .. 2 |. Should not be smaller than 10% of min or max.",
                        },
                        "stepDist": {
                            "type": "number",
                            "description": "Distance in px between steps.",
                        },
                        "precision": {
                            "type": "number",
                            "description": "Slider precision.",
                            "minimum": 0.01,
                        }
                    },
                }
            },
            "required": [
                "id", "text", "direction"
            ]
        };

        const showButtons = () => {
            const expandable = 'jsoneditor-expandable';

            document.querySelectorAll('.jsoneditor-tree tbody > tr').forEach((node) => {
                const prev = node.previousSibling;
                const next = node.nextSibling;

                if (prev !== null && prev.classList.contains(expandable) && node.classList.contains(expandable)) {
                    if (next.nextSibling === null || !next.nextSibling.classList.contains(expandable)) {
                        node.classList.add('showButton');
                    }
                }
            })
        };

        this._editorContainer.addEventListener('click', showButtons);

        const options = {
            mode: 'tree',
            schema: schema,
            schemaRefs: {
                "item": item
            },
            enableSort: false,
            enableTransform: false,
            mainMenuBar: true,
            history: false,
            navigationBar: false,
            statusBar: false,
            templates: [
                {
                    text: 'Action',
                    title: 'Insert a Menu Item Action',
                    className: 'jsoneditor-type-object',
                    field: 'MenuItem',
                    value: {
                        'id': "",
                        'text': "",
                        'icon': "",
                        'direction': "",
                        'children': [],
                    }
                },
                {
                    text: 'Checkbox',
                    title: 'Insert a Checkbox',
                    className: 'jsoneditor-type-object',
                    field: 'Checkbox',
                    value: {
                        'id': "",
                        'text': "",
                        'icon': "",
                        'direction': "",
                        'type': 'checkbox',
                        'data': {
                            'selected': false,
                        }
                    }
                },
                {
                    text: 'Slider',
                    title: 'Insert a Slider',
                    className: 'jsoneditor-type-object',
                    field: 'Slider',
                    value: {
                        'id': "",
                        'text': "",
                        'icon': "",
                        'direction': "",
                        'type': 'slider',
                        'data': {
                            'min': -1,
                            'max': 1,
                            'initial': 0,
                            'stepSize': 1,
                            'stepDist': 100,
                            'precision': 1
                        }
                    }
                },
                {
                    text: 'RadioGroup',
                    title: 'Insert a Radio Group',
                    className: 'jsoneditor-type-object',
                    field: 'RadioGroup',
                    value: {
                        'id': "",
                        'text': "",
                        'icon': "",
                        'direction': "",
                        'type': 'radio-group',
                        'children': [],
                    }
                }
            ],
            autocomplete: {
                filter: 'contain',
                trigger: 'focus',
                getOptions: (text, path) => {
                    if (path === null || path[path.length - 1] !== 'icon') {
                        return null;
                    }

                    return faNames;
                }
            },
            onEditable: (node) => {
                return {
                    field: node.field === 'MenuItem' || node.field === 'Checkbox' || node.field === 'Slider' || node.field === 'RadioGroup',
                    value: true
                };
            },
            onNodeName: (node) => {
                if (node.path.length > 0 && node.path[0] === 'children' && node.type === 'object') {
                    if (node.path[node.path.length - 1] === 'data') {
                        return 'Settings'
                    }

                    return 'MenuItem';
                }
            },
            onCreateMenu: (items, node) => {
                if (node.type === 'single' && (node.path.length === 1 || node.path[node.path.length - 1] === 'children')) {
                    return [];
                }
                if (node.type === 'append' && node.path[node.path.length - 1] !== 'children') {
                    return [];
                }

                const filtered = items.filter((item) => {
                    return item.text === 'Append' || item.text === 'Remove';
                });

                filtered.forEach((entry, index, menu) => {
                    if (entry.text !== 'Remove') {
                        menu[index].click = null;
                    }

                    if (typeof menu[index].submenu !== "undefined") {
                        menu[index].submenu = menu[index].submenu.filter((item) => {
                            return item.text === 'Action' || item.text === 'Slider' || item.text === 'Checkbox' || item.text === 'RadioGroup';
                        });
                    }
                });

                return filtered;
            },
            onValidationError: (errors) => {
                this._isValidJson = errors.length === 0;
            },
            onEvent: showButtons,
        };

        this._editor = new JSONEditor(this._editorContainer, options);
        this._editor.set(this._structure);
        this._editor.expandAll();
        this._editor.setName('Root');
    }

    /**
     * Checks a JSON structure and outputs errors to the page
     * @param {JSON} struct
     * @return {boolean}
     * @private
     */
    _checkStruct(struct) {
        const warn = document.getElementById('warn');

        const parser = new tasty.parser();
        parser.parse(struct);
        if (parser.hasDuplicateIds()) {
            warn.textContent = `Duplicate IDs found: ${parser.duplicateIds.toString()}`;

            return false;
        } else {
            warn.textContent = '';
        }

        return true;
    }

    /**
     * Parse the struct and display the menu centered
     * @private
     */
    _displayMenu() {
        this._menu._scope.project.clear();
        this._menu.setStructure((new tasty.parser()).parse(this._structure));
        this._menu.display({
            x: this._canvasContainer.offsetWidth / 2,
            y: this._canvasContainer.offsetHeight / 2
        });
    }
}