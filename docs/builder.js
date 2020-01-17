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
            const warn = document.getElementById('warn');
            this._structure = this._editor.get();

            const parser = new tasty.parser();
            parser.parse(this._editor.get());
            if (parser.hasDuplicateIds()) {
                warn.textContent = `Duplicate IDs found: ${parser.duplicateIds.toString()}`;

                return;
            } else {
                warn.textContent = '';
            }

            if (!this._isValidJson) {
                warn.textContent = 'JSON is not valid.';
                return;
            }
            document.getElementById('jsonOutput').value = JSON.stringify(this._editor.get());
            this._displayMenu();
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
                    "description": "unique item id",
                    "minLength": 1,
                },
                "text": {
                    "type": "string",
                    "description": "Item Text",
                    "minLength": 1,
                },
                "icon": {
                    "type": "string",
                    "description": "Font Awesome Icon Name without 'fa'",
                    "minLength": 1,
                },
                "direction": {
                    "type": "integer",
                    "description": "0 - 360°",
                    "minimum": 0,
                    "maximum": 360,
                },
                "children": {
                    "type": "array",
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
                    "description": "unique item id",
                    "minLength": 1,
                },
                "text": {
                    "type": "string",
                    "description": "Item Text",
                    "minLength": 1,
                },
                "icon": {
                    "type": "string",
                    "description": "Font Awesome Icon Name without 'fa'",
                    "minLength": 1,
                },
                "direction": {
                    "type": "integer",
                    "description": "0 - 360°",
                    "minimum": 0,
                    "maximum": 360,
                },
                "children": {
                    "type": "array",
                    "items": {
                        "$ref": "item"
                    }
                }
            },
            "required": [
                "id", "text", "icon", "direction"
            ]
        };

        const options = {
            mode: 'tree',
            schema: schema,
            schemaRefs: {
                "item": item
            },
            enableSort: false,
            enableTransform: false,
            templates: [
                {
                    text: 'Action',
                    title: 'Insert a Menu Item Action',
                    className: 'jsoneditor-type-object',
                    field: 'Menuitem',
                    value: {
                        'id': "",
                        'text': "",
                        'icon': "",
                        'direction': 0,
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
                        'direction': 0,
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
                        'direction': 0,
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
                }
            ],
            autocomplete: {
                filter: 'contain',
                getOptions: (text, path) =>{
                    if (path[path.length - 1] !== 'icon') {
                        return null;
                    }

                    return faNames;
                }
            },
            onEditable: (node) => {
                return {
                    field: false,
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
                    return item.text === 'Append';
                });

                filtered.forEach((entry, index, menu) => {
                    menu[index].click = null;
                    menu[index].submenu = menu[index].submenu.filter((item) => {
                        return item.text === 'Action' || item.text === 'Slider' || item.text === 'Checkbox';
                    });
                });

                return filtered;
            },
            onValidationError: (errors) => {
                this._isValidJson = errors.length === 0;
            }
        };

        this._editor = new JSONEditor(this._editorContainer, options);
        this._editor.set(this._structure);
        this._editor.expandAll();
        this._editor.setName('RootItem');
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