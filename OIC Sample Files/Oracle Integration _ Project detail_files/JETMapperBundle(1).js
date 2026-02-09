/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define({
      "JETMAPPER_VALIDATED_ERROR" : "Validated with {0} error(s) and {1} warning(s).",
      "JETMAPPER_NO_XML_ID" : "This document does not contain XML'ids generated.  This is needed for customization.",        
      "XSLT_FUNCTION_NAME" : "Function", 
      "XSLT_OPERATOR_NAME" : "Operator", 
      "XSLT_KEYWORD_NAME" : "XSL Element",

      "XSLT_FUNCTION_DESC_REQUIRED_KEY":"Required",
      "XSLT_FUNCTION_DESC_OPTIONAL_KEY":"Optional",

      "XSLT_KEYWORD_DESC_ATTRIBUTE" :
        "The xsl:attribute element can be used to add attributes to result elements whether created by literal result elements in the stylesheet or by instructions such as xsl:element.",
      "XSLT_KEYWORD_DESC_ATTRIBUTE_NIL" :
        "The attribute name='xsi:nil' element can be used to add xsi:nil attribute to the result elements.",
      "XSLT_KEYWORD_DESC_CHOOSE" : 
        "The xsl:choose element selects one among a number of possible alternatives. It consists of a sequence of xsl:when elements followed by an optional xsl:otherwise element.",
      "XSLT_KEYWORD_DESC_COPY_OF" :
         "The xsl:copy-of element can be used to insert a result tree fragment into the result tree, without first converting it to a string as xsl:value-of does.",
      "XSLT_KEYWORD_DESC_FOREACH" :
        " The xsl:for-each instruction contains a template, which is instantiated for each node selected by the expression specified by the select attribute. The select attribute is required. The expression must evaluate to a node-set.",
      "XSLT_KEYWORD_DESC_IF" :
        "The xsl:if element has a test attribute, which specifies an expression. The content is a template. The expression is evaluated and the resulting object is converted to a boolean as if by a call to the boolean function. If the result is true, then the content template is instantiated; otherwise, nothing is created.",
      "XSLT_KEYWORD_DESC_OTHERWISE" :
        "Used in conjunction with xsl:choose.  The content of the first, and only the first, xsl:when element whose test is true is instantiated. If no xsl:when is true, the content of the xsl:otherwise element is instantiated. ",
      "XSLT_KEYWORD_DESC_TEXT":"Literal data characters may also be wrapped in an xsl:text element.",
      "XSLT_KEYWORD_DESC_VALUEOF" :
        "The xsl:value-of element is instantiated to create a text node in the result tree.",
      "XSLT_KEYWORD_DESC_VARIABLE" :
        "The xsl:variable element can be used as a top-level element or within templates. A top-level variable-binding element declares a global variable that is visible everywhere.",
      "XSLT_KEYWORD_DESC_WHEN" : "Used in conjunction with xsl:choose.  Each xsl:when element has a single attribute, test, which specifies an expression.",

      "XSLT_OPERATOR_DESC_ADDITION" : "Adds 2 numbers.",
      "XSLT_OPERATOR_DESC_AND" : "Returns true if both parameters evaluate to true; returns false otherwise.",
      "XSLT_OPERATOR_DESC_COMPUTE" :
        "XPath union operator |. Computes the union of its operands, which must be node-sets.",
      "XSLT_OPERATOR_DESC_DIVISION" : "Returns the first number divided by the second number.",
      "XSLT_OPERATOR_DESC_EQUAL" : "Returns true if the two parameters are equal; returns false otherwise.",
      "XSLT_OPERATOR_DESC_GREATERTHAN" :
        "Returns true if the first parameter is greater than the second parameter; returns false otherwise.",
      "XSLT_OPERATOR_DESC_GREATERTHANEQUAL" :
        "Returns true if the first parameter is greater than or equals the second parameter; returns false otherwise.",
      "XSLT_OPERATOR_DESC_LESSTHAN" :
        "Returns true if the first parameter is less than the second parameter; returns false otherwise.",
      "XSLT_OPERATOR_DESC_LESSTHANEQUAL" :
        "Returns true if the first parameter is less than or equals the second parameter; returns false otherwise.",
      "XSLT_OPERATOR_DESC_MODULUS" : "Returns the remainder from a truncating division.",
      "XSLT_OPERATOR_DESC_MULTIPLICATION" : "Multiplies 2 numbers.",
      "XSLT_OPERATOR_DESC_NOTEQUAL" :
        "Returns true if the two parameters not are equal; returns false otherwise.",
      "XSLT_OPERATOR_DESC_OR" : "Returns true if either parameters evaluate to true. Returns false otherwise.",
      "XSLT_OPERATOR_DESC_SUBTRACT" : "Subtracts the second number from the first number.",
      "XSLT_OPERATOR_DESC_UNARY" : "Returns the negative value of the number",
  
      //DIALOG.js 
      "DIALOG_OK": "OK",
      "DIALOG_CANCEL": "Cancel",
      "DIALOG_YES": "Yes",
      "DIALOG_NO": "No",
      "DIALOG_XPATHS_REFACTORED_TITLE": "Mappings not adjusted",
      "DIALOG_XPATHS_REFACTORED_WARNING": "Some child mappings were adjusted automatically due to for-each changes but the following statements contain predicates and were not adjusted.  Please review and manually adjust these mappings if necessary.",
      "DIALOG_XPATHS_REFACTORED_TARGETTEXT": "Target",
      "DIALOG_XPATHS_REFACTORED_MAPPINGTEXT": "Mapping",
      "DIALOG_DELETE_CHILDREN_TITLE": "Delete children",
      "DIALOG_DELETE_CHILDREN_WARNING": "This node can be deleted with or without deleting its children. Select Yes to delete the node and its children.  Select No to delete the node but keep its children.",
      "DIALOG_DELETE_LAST_WHEN_TITLE": "Delete warning",
      "DIALOG_DELETE_LAST_WHEN_WARNING": "This is the last when of a choose statement.  Select Yes to delete the associated choose and otherwise statements. Select No to cancel the delete.",
      "DIALOG_YES_RADIO": "Yes",
      "DIALOG_NO_RADIO": "No",
      "DIALOG_DISABLE_OUTPUT_ESCAPING": "disable-output-escaping",
      "DIALOG_QNAME_ENTER": "Enter",
      "DIALOG_QNAME_NAME": "Name",
      "DIALOG_QNAME_NAMESPACE_TITLE": "Namespace",
      "DIALOG_QNAME_PREFIX_TITLE": "Prefix",
      "DIALOG_SET_ATTRIBUTES": "Set attributes for element",
      "DIALOG_VARIABLE_TITLE": "Variable",
      "DIALOG_PARAMETER_TITLE": "Parameter",
      "DIALOG_SELECT_ATTRIBUTES": "Attribute selection",
      "DIALOG_NO_ATTRIBUTES_TITLE": "No attributes to select",
      "DIALOG_LITERAL_TITLE": "Literal dialog",
      "DIALOG_LITERAL_LABEL": "Enter literal text",
      "DIALOG_LITERAL_PLACE_HOLDER": "Required filed",
      "UI_LITERAL_LABEL": "Literal value for: ",
      
      //xpathsFxAndOps.js
      "FX_DESC_LEARN_MORE": "Learn more",     
      
      //Transaction.js

      //Recommned
      "RECOMMNEND_DILAOG_TITLE" : "Choose sources",
      "RECOMMNEND_DILAOG_TITLE_TEXT" : "Select at least one source to use for recommended mappings. Select no more than three sources.",
      "RECOMMNEND_COMPLEX_SOURCES" : "Complex sources",
      "RECOMMNEND_SIMPLE_SOURCES" : "Simple sources",
      "RECOMMNEND_SIMPLE_SOURCE_HINT" : "Simple sources includes tracking, assignment and global non complex variables.",
      
      //mapperData.js
      "MAPPER_DATA_REPEAT_ELEMENT_NUMBER": "{0} of {1}", //Index out of Count (e.g. 1 of 3, 2 of 3, 3 of 3)
      
      //Canvas.js
      "CANVAS_FX_OPS_SIMPLENODES": "Functions and Operators can only be dropped on simple nodes",
      "CANVAS_NODE_MAPPED": "This node is already mapped",
      "CANVAS_TGT_NODE_MAPPED": "Target node is already mapped",
      "CANVAS_MULTIPLE_CHILD_VALUEOF": "Cannot drag and drop to a node that has multiple child xsl:value-of statements.",
      "CANVAS_NO_DD_SUPPORT": "The XSLT statement is not supported for drag and drop.",
      "CANVAS_NO_DD_STRUCTURAL": "Drag and drop to a structual element is not supported.",
      "CANVAS_SRC_MUST_REPEATING": "Source node must be a repeating element",
      "CANVAS_TGT_MUST_REPEATING": "Target node must be a repeating element",
      "CANVAS_TGT_EXT_TYPE_ATTR": "Type attribute for extended elements cannot be mapped",
      "CANVAS_COMPLEX_REPEATING": "Complex nodes can only be mapped if both source and target are repeating elements",
      "CANVAS_SRC_COMPLEX_REPEATING": "Complex source node can only be dropped on a Simple Target node when both nodes are repeating",
      "CANVAS_SRC_NOT_REPEATING": "Source node is not repeating",
      "CANVAS_COMPLEX_NOT_VALUEOF": "Complex node cannot be dropped on xsl:value-of",
      "CANVAS_NODE_NO_DD_SUPPORT": "This XSLT node is not supported for drag and drop",
      "CANVAS_SRC_MUST_SIMPLE": "Source node must be simple node",
      "CANVAS_NODE_NOT_FOUND": "XSLT node not found",
      "CANVAS_ATTRIBUTE_NOT_COPYOF": "Attribute cannot be dropped on xsl:copy-of",
      "CANVAS_FUNCTION_NO_SUPPORT": "Function's return type is not valid for copy-of.Function's return type must be node or node-set.",
      "CANVAS_VALUE_COPY_NOT_ANYTYPE": "Both xsl:copy-of and xsl:value-of cannot be present together on anyType node",
      "CANVAS_DROP_NOT_ALLOWED": "Drop not allowed",
      "CANVAS_VALUE_OF_DROP_NOT_ALLOWED": "Value-of cannot be dropped as child on complex nodes",
      "CANVAS_FIRST_VALUE_OF": "This value-of node is not displayed in UI after dropping, it's displayed only when it has any other XSLT node as parent or sibling",
      "CANVAS_NODE_NO_DD_SUPPORT_XSLT_ON_GHOST": "The XSLT construct cannot be dropped here.Please create target node first, and then drag and drop the XSLT construct.",
      "REPEAT_NODE_EXCEEDED": "The total count of repeated elements exceeds the maxoccurs for the element",
      //TransEdit.js
      "TRANSEDIT_READONLYMAP": "Map is in view mode",
      
      //filter.js
      "FILTER_ALL_LABEL": "All",

      "FILTER_FIELDS_LABEL": "Fields",
      "FILTER_MAPPED_LABEL": "Mapped",
      "FILTER_UNMAPPED_LABEL": "Unmapped",
      "FILTER_FIELDS_TITLE": "Filter based on whether fields are mapped or not",

      "FILTER_TYPES_LABEL": "Types",
      "FILTER_REQUIRED_LABEL": "Required",
      "FILTER_REQUIRED_TYPE_LABEL": "Required type",
      "FILTER_CUSTOM_TYPE_LABEL": "Custom type",
      "FILTER_CUSTOM_TITLE": "Filter based on whether field type is standard or custom",
      
      "FILTER_CUSTOM_LABEL": "Custom",
      "FILTER_CUSTOMIZED_LABEL": "Customized",
      "FILTER_MAPPINGS_LABEL": "Mappings",
      "FILTER_STANDARD_LABEL": "Standard",
      "FILTER_STANDARD_MAPPING_LABEL": "Standard mapping",
      "FILTER_CUSTOM_MAPPING_LABEL": "Customized mapping",
      "FILTER_MAPPING_TITLE": "Filter based on whether the mappings originated standard or customized",
      
      "FILTER_VALIDATIONS_LABEL": "Validations",
      "FILTER_ERROR_LABEL": "Errors",
      "FILTER_WARNING_LABEL": "Warnings",
      "FILTER_NO_ISSUES_LABEL": "No Issues",
      "FILTER_VALIDATIONS_TITLE": "Filter based on results of validation",
      
      "FILTER_SOURCES_LABEL": "Sources",
      "FILTER_SOURCES_TITLE": "Filter based on one or more sources",
      "FILTER_SOURCE_LABEL": "Source",
      "FILTER_TARGET_LABEL": "Target",
      
      "FILTER_REMOVE_SOURCE_FILTER_TITLE": "Remove all source filters",
      "FILTER_REMOVE_TARGET_FILTER_TITLE": "Remove all target filters",
      "FILTER_REMOVE_FILTER_TITLE": "Remove Filter",
      
      //pageMessaging.js
      "PAGE_MSG_ICON_TITLE_ERROR": "Error message",
      "PAGE_MSG_ICON_TITLE_WARNING": "Warning message",
      "PAGE_MSG_ICON_TITLE_CONFIRM": "Confirmation message",
      "PAGE_MSG_ICON_TITLE_INFO": "Information message",
      "PAGE_MSG_BADGE_TITLE": "Click to see additional messages",
      "PAGE_MSG_CLOSE_TITLE": "Remove this message",
      
      //search.js
      "SEARCH_NEXT_LABEL": "Next",
      "SEARCH_PREVIOUS_LABEL": "Previous",
      "SEARCH_CLOSE_LABEL": "Close",
      "SEARCH_SEARCH_LABEL": "Search",
      "SEARCH_WARNING_LABEL": "Warning",
      "SEARCH_WARNING_DETAIL": "Search phrase not found",
      "SEARCH_TIMEOUT_DETAIL": "Search time out",
      "SEARCH_TIMEOUT_TIP_SOURCE": "Try selecting a Source that might have it",
      "SEARCH_TIMEOUT_TIP_TARGET": "Try selecting a target node that might have your search string",
      "SEARCH_TIMEOUT_TIP_COMPONENT": "Try selecting a component that might have your search string",
      
      //ui.js
      "UI_SAVE_LABEL": "Save",
      "UI_EXPRESSION_LABEL": "Expression for",
      "UI_TEXT_FOR_LABEL": "Text for",
      "UI_CLOSE_LABEL": "Close",
      "UI_ERASE_LABEL": "Erase",
      "UI_SHUTTLE_LABEL": "Insert selected item",
      "UI_SHOW_PARENT_TEXT": "Show parent",
      "UI_NOT_FOUND_TEXT": "not found",
      "UI_ERROR_IMAGE_LABEL": "Error",
      "UI_WARNING_IMAGE_LABEL": "Warning",
      "UI_SETTEXT_LABEL": "Set Text",
      "UI_CONTINUE_SEARCH_TITLE": "Continue searching",
      "UI_CONTINUE_SEARCH_DESCRIPTION": "Search is taking longer than expected. Do you want to continue searching?",

      "SCHEMA_INFO_XSLT_INFO_TITLE": "XSLT Info",
      "SCHEMA_INFO_SCHEMA_INFO_TITLE": "Schema info",
      "SCHEMA_INFO_XSLT_INSTRUCT_LABEL": "XSLT instruction:",
      "SCHEMA_INFO_TEXT_LABEL": "Text:",
      "SCHEMA_INFO_MAPPING_LABEL": "Mapping:",
      "SCHEMA_INFO_PATH_LABEL": "Path:",
      "SCHEMA_INFO_DOC_LABEL": "Documentation:",
      "SCHEMA_INFO_DATA_TYPE_LABEL": "DataType:",
      "SCHEMA_INFO_CONTENT_TYPE_LABEL": "ContentType:",
      "SCHEMA_INFO_NODE_TYPE_LABEL": "NodeType:",
      "SCHEMA_INFO_REQUIRED_LABEL": "Required:",
      "SCHEMA_INFO_NILLABLE_LABEL": "Nillable:",
      "SCHEMA_INFO_ABSTRACT_LABEL": "Abstract:",
      "SCHEMA_INFO_REPEATING_LABEL": "Repeating:",
      "SCHEMA_INFO_MIN_OCCURS_LABEL": "minOccurs:",
      "SCHEMA_INFO_MAX_OCCURS_LABEL": "maxOccurs:",
      "SCHEMA_INFO_NAMESPACE_LABEL": "Namespace:",
      "SCHEMA_INFO_XPATH_LABEL": "XPath:",
      "SCHEMA_INFO_DEFAULT_VALUE_LABEL": "DefaultValue:",
      "SCHEMA_INFO_FIXED_VALUE_LABEL": "FixedValue:",
      "SCHEMA_INFO_TITLE_LABEL": "Title:",
      "SCHEMA_INFO_DESC_LABEL": "Description:",
      "SCHEMA_INFO_CUSTOM_LABEL": "Custom:",
      "SCHEMA_INFO_UPDATABLE_LABEL": "Updatable:",
      "SCHEMA_INFO_MIN_LENGTH_LABEL": "minLength:",
      "SCHEMA_INFO_MAX_LENGTH_LABEL": "maxLength:",
      "SCHEMA_INFO_MIN_VALUE_LABEL": "minValue:",
      "SCHEMA_INFO_MAX_VALUE_LABEL": "maxValue:",
      "SCHEMA_INFO_CUSTOMIZED_MAPPING_LABEL": "Mapping is customized",
      "SCHEMA_INFO_FHIREXT_HEADING_LABEL": "FHIR named object",
      "SCHEMA_INFO_FHIREXT_URL_LABEL": "Ext Url",
      "SCHEMA_INFO_FHIREXT_DATATYPE_LABEL": "Ext DataType",
      
      //JETMapperInitializer.js
      "CONTEXT_MENU_MAKE_ROOT_NODE": "Make root node",
      "CONTEXT_MENU_NODE_INFO": "Node info",
      "CONTEXT_MENU_SET_ATTRIBUTE_VALUES": "Set attribute values",            
      "CONTEXT_MENU_CREATE_TARGET_NODE": "Create target node",
      "CONTEXT_MENU_ADD_DEFAULT_VALUE": "Add default value",
      "CONTEXT_MENU_DELETE_TARGET_NODE": "Delete target node",
      "CONTEXT_MENU_DELETE_MAPPING": "Delete mapping",
      "CONTEXT_MENU_DELETE_CHILDREN": "Delete all child target nodes",
      "CONTEXT_MENU_REPEAT_NODE": "Repeat node",
      "CONTEXT_MENU_RECOMMEND": "Recommend",
      "CONTEXT_MENU_DESIGNER": "Designer",
      "CONTEXT_MENU_EXT_DATA_TYPE": "Extended data types",
      
      "EDITING_TOOLBAR_VIEW_LABEL": "View",
      "EDITING_TOOLBAR_FILTER_LABEL": "Filter",
      "EDITING_TOOLBAR_UNDO_LABEL": "Undo",
      "EDITING_TOOLBAR_REDO_LABEL": "Redo",
      "EDITING_TOOLBAR_HELP_LABEL": "Help",
      "EDITING_TOOLBAR_RECOMMEND_LABEL": "Recommend",
      "EDITING_TOOLBAR_CODE_LABEL": "Code",
      "EDITING_TOOLBAR_TEST_LABEL": "Test",
      "EDITING_TOOLBAR_VIEW_OPTIONS_LABEL": "View options",
      "EDITING_TOOLBAR_SHOW_XSLT_LABEL": "XSLT",
      "EDITING_TOOLBAR_SHOW_PREFIXES_LABEL": "Show prefixes",
      "EDITING_TOOLBAR_SHOW_TYPES_LABEL": "Show types",
      "EDITING_TOOLBAR_SHOW_TYPE_ICON_LABEL": "Show type icons",
      "EDITING_TOOLBAR_TOGGLE_FX_LABEL": "Toggle functions",
      "EDITING_TOOLBAR_TOGGLE_MAX_LABEL": "Toggle maximize",
      "EDITING_TOOLBAR_DEV_MODE_LABEL": "Developer Mode",
      
      "TESTXSL_DONE_LABEL": "Done",
      "TESTXSL_GENERATE_INPUTS_LABEL": "Generate inputs",   
      "TESTXSL_HELP_LABEL": "Help",           
      "TESTXSL_CLEAR_LABEL": "Clear",   
      "TESTXSL_EXECUTE_LABEL": "Execute",   
      "TESTXSL_SOURCE_LABEL": "Source",
      "TESTXSL_TARGET_LABEL": "Target",
      
      "CODE_TOOLBAR_DONE_LABEL": "Done",
      
      "RECOMMEND_SUMMARY": "Recommendations",
      "RECOMMEND_APPLY_DETAIL": "Our best recommendations have been suggested. You can accept them now or click on a line to explore alternatives.",
      "NO_RECOMMEND_APPLIED_DETAIL" : "There is no recommendation. We could not find any matching suggestion.",
      "ALLOWED_SOURCES_FOR_RECOMMENDATION": "Maximum three complex sources can be selected.",
      "MIN_ALLOWED_SOURCES_FOR_RECOMMENDATION": "Atleast one source should be selected.",
      "RECOMMEND_DONE_LABEL": "Done",   
      "RECOMMEND_STRENGTH_LABEL": "Strength", 
      "RECOMMEND_RELEVANCE_SELECT_ALLL": "Select all",
      "RECOMMEND_SHOW_MAPPINGS_LABEL": "Show mappings",   
      "RECOMMEND_FILTER_LABEL": "Filter",
      "RECOMMEND_OK_LABEL": "Apply",
      "RECOMMEND_CHOOSE_LABEL": "Apply recommendations",
      "RECOMMEND_CHOICESOURCE_ORACLE": "Oracle",
      "RECOMMEND_CHOICESOURCE_CUSTOMER": "Customer",
      "RECOMMEND_CHOICESOURCE_INFERENCE": "Inference",
      "RECOMMEND_CHOOSE_RECOMMENDATIONS": "Do you want to apply the suggested recommendations?",
      "RECOMMEND_TOTAL_RECOMMENDATIONS": "Total recommendations",            
      "RECOMMEND_SELECTED_RECOMMENDATIONS": "Selected recommendations",
      "EDITING_TOOLBAR_RECOMMEND_AVAILABLE_HEADER": "Recommendations available",
      "EDITING_TOOLBAR_RECOMMEND_AVAILABLE_DETAIL": "Click on recommend to see our suggestions.",
      
      // dialog text items
      "RECOMMEND_INCLUDE_LABEL": "Include",
      "RECOMMEND_SOURCE_LABEL": "Source",
      "RECOMMEND_TARGET_LABEL": "Target",
      "RECOMMEND_SOURCE_NAME_LABEL": "Source name",
      
      //Strength Options
      "RECOMMEND_STRENGTH_OPTION_ALL": "All",
      "RECOMMEND_STRENGTH_OPTION_LOW": "Low",
      "RECOMMEND_STRENGTH_OPTION_MEDIUM": "Medium strength",
      "RECOMMEND_STRENGTH_OPTION_HIGH": "High strength",
      //Recommended By
      "RECOMMEND_SOURCEDBY_HEADER_LABEL": "Sourced by", 
      "RECOMMEND_SOURCEDBY_ALL": "All", 
      "RECOMMEND_SOURCEDBY_CUSTOMER": "Customer", 
      "RECOMMEND_SOURCEDBY_ORACLE": "Oracle",
      "RECOMMEND_ALTERNATE_LABEL": "Alternatives for {0}",           
      "RECOMMEND_CANVAS_LABEL": "Recommended mapping",         
      
      "MAPPING_CANVAS_LABEL": "Mapping canvas",
      
      "COMPONENTS_LABEL": "Components",
      "COMPONENTS_FX_LABEL": "Functions",
      "COMPONENTS_OPS_LABEL": "Operators",
      "COMPONENTS_XSLT_LABEL": "XSLT",
                  
      //testXSL.js                        
      "WARNING": "Warning",
      
      /* *****************  Category Translations *******************************/
      "CATEGORY_ADVANCED_KEY": "Advanced", "CATEGORY_BOOLEAN_KEY": "Boolean",
      "CATEGORY_CONVERSION_KEY": "Conversion", "CATEGORY_DATE_KEY": "Date", "CATEGORY_DVM_KEY": "DVM",
      "CATEGORY_MATHEMATICAL_KEY": "Mathematical", "CATEGORY_NODESET_KEY": "Node-set",
      "CATEGORY_STRING_KEY": "String", "CATEGORY_XREF_KEY": "XREF",
      "CATEGORY_USERDEFINED_KEY": "User Defined", "CATEGORY_ICS_KEY": "Integration Cloud",
      "CATEGORY_SOA_KEY": "SOA", "CATEGORY_SERVICEBUS_KEY": "Service Bus",
      "CATEGORY_DATABASE_KEY": "Database", "CATEGORY_MEDIATOR_KEY": "Mediator",
      "CATEGORY_GENERAL_KEY": "General", "CATEGORY_FUNCTIONS_KEY": "Functions",
      "CATEGORY_OPERATORS_KEY": "Operators", "CATEGORY_XSLELEMENTS_KEY": "XSL Elements",
      "CATEGORY_XSLTINFO_KEY": "XSLT Info",
      "CATEGORY_XSLT_OUTPUT": "Output",
      "CATEGORY_XSLT_FLOW_CONTROL": "Flow Control",
      "CATEGORY_XSLT_VARIABLES_PARAMETERS": "Variables",
      "CATEGORY_XSLT_TEMPLATE_CONTROL": "Template Control",
      "CATEGORY_XSLT_DECLARATIONS": "Declarations",
      "CATEGORY_XSLT_ERROR_HANDLING": "Error Handling",
      "CATEGORY_XSLT_OUTPUT": "Output",

      /* *****************  Function Description Translations *******************************/
      "FUNCTION_BOOLEAN_DESC_KEY" : "This function converts its argument to a boolean.",
      "FUNCTION_CEILING_DESC_KEY" :
        "This function returns the smallest (closest to negative infinity) number that is not less than the argument and that is an integer.",
      "FUNCTION_CONCAT_DESC_KEY" : "This function returns the concatenation of its arguments.",
      "FUNCTION_REPLACE_DESC_KEY" : "This function returns a string that is created by replacing the given pattern with the replace argument",
      "FUNCTION_CONTAINS_DESC_KEY" :
        "This function returns true if the first argument string contains the second argument string, and otherwise returns false.",
      "FUNCTION_COUNT_DESC_KEY" : "This function returns the number of nodes in the argument node-set.",
      "FUNCTION_MATCHES_DESC_KEY": "This function returns true if the supplied string matches a given regular expression.",
      "FUNCTION_TOKENIZE_DESC_KEY": "This function returns a sequence of strings constructed by splitting the input wherever a separator is found; the separator is any substring that matches a given regular expression.",
      "FUNCTION_FALSE_DESC_KEY" : "This function returns false.",
      "FUNCTION_FLOOR_DESC_KEY" :
        "This function returns the largest (closest to positive infinity) number that is not greater than the argument and that is an integer.",
      "FUNCTION_NAMESPACEURI_DESC_KEY" :
        "This function returns the namespace URI of the expanded-name of the node in the argument node-set that is first in document order. If the argument node-set is empty, the first node has no expanded-name, or the namespace URI of the expanded-name is null, an empty string is returned. If the argument is omitted, it defaults to a node-set with the context node as its only member.  NOTE: The string returned by the namespace-uri function will be empty except for element nodes and attribute nodes.",
      "FUNCTION_LANG_DESC_KEY" :
        "This function returns true or false depending on whether the language of the context node as specified by xml:lang attributes is the same as or is a sublanguage of the language specified by the argument string.",
      "FUNCTION_LAST_DESC_KEY" :
        "This function returns a number equal to the context size from the expression evaluation context.",
      "FUNCTION_LOCALNAME_DESC_KEY" :
        "This function returns the local part of the expanded-name of the node in the argument node-set that is first in document order. If the argument node-set is empty or the first node has no expanded-name, an empty string is returned. If the argument is omitted, it defaults to a node-set with the context node as its only member.",
      "FUNCTION_NAME_DESC_KEY" :
        "This function returns a string containing a QName representing the expanded-name of the node in the argument node-set that is first in document order. The QName must represent the expanded-name with respect to the namespace declarations in effect on the node whose expanded-name is being represented. Typically, this will be the QName that occurred in the XML source. This need not be the case if there are namespace declarations in effect on the node that associate multiple prefixes with the same namespace. However, an implementation may include information about the original prefix in its representation of nodes; in this case, an implementation can ensure that the returned string is always the same as the QName used in the XML source. If the argument node-set is empty or the first node has no expanded-name, an empty string is returned. If the argument it omitted, it defaults to a node-set with the context node as its only member.\n" +
        "NOTE: The string returned by the name function will be the same as the string returned by the local-name function except for element nodes and attribute nodes.",
      "FUNCTION_NORMALIZESPACE_DESC_KEY" :
        "This function returns the argument string with whitespace normalized by stripping leading and trailing whitespace and replacing sequences of whitespace characters by a single space. Whitespace characters are the same as those allowed by the S production in XML. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node.",
      "FUNCTION_NOT_DESC_KEY" : "This function returns true if its argument is false, and false otherwise.",
      "FUNCTION_NUMBER_DESC_KEY" :
        "This function converts its argument to a number. NOTE: The number function should not be used for conversion of numeric data occurring in an element in an XML document unless the element is of a type that represents numeric data in a language-neutral format (which would typically be transformed into a language-specific format for presentation to a user). In addition, the number function cannot be used unless the language-neutral format used by the element is consistent with the XPath syntax for a Number.",
      "FUNCTION_POSITION_DESC_KEY" :
        "This function returns a number equal to the context position from the expression evaluation context.",
      "FUNCTION_ROUND_DESC_KEY" :
        "This function returns the number that is closest to the argument and that is an integer.  NOTE: For these last two cases, the result of calling the round function is not the same as the result of adding 0.5 and then calling the floor function.",
      "FUNCTION_STARTSWITH_DESC_KEY" :
        "This function returns true if the first argument string starts with the second argument string, and otherwise returns false.",
      "FUNCTION_STRING_DESC_KEY" :
        "This function converts an object to a string. NOTE: The string function is not intended for converting numbers into strings for presentation to users.",
      "FUNCTION_STRINGLENGTH_DESC_KEY" :
        "This returns the number of characters in the string. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node.",
      "FUNCTION_SUBSTRING_DESC_KEY" :
        "This returns the number of characters in the string. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node.",
      "FUNCTION_SUBSTRINGAFTER_DESC_KEY" :
        "This function returns the substring of the first argument string that follows the first occurrence of the second argument string in the first argument string, or the empty string if the first argument string does not contain the second argument string. For example, substring-after(\"1999/04/01\",\"/\") returns 04/01, and substring-after(\"1999/04/01\",\"19\") returns 99/04/01.",
      "FUNCTION_SUBSTRINGBEFORE_DESC_KEY" :
        "This function returns the substring of the first argument string that precedes the first occurrence of the second argument string in the first argument string, or the empty string if the first argument string does not contain the second argument string. For example, substring-before(\"1999/04/01\",\"/\") returns 1999.",
      "FUNCTION_SUM_DESC_KEY" :
        "This function returns the sum, for each node in the argument node-set, of the result of converting the string-values of the node to a number.",
      "FUNCTION_TRANSLATE_DESC_KEY" :
        "This function returns the first argument string with occurrences of characters in the second argument string replaced by the character at the corresponding position in the third argument string. For example, translate(\"bar\",\"abc\",\"ABC\") returns the string BAr. If there is a character in the second argument string with no character at a corresponding position in the third argument string (because the second argument string is longer than the third argument string), then occurrences of that character in the first argument string are removed. For example, translate(\"--aaa--\",\"abc-\",\"ABC\") returns \"AAA\". If a character occurs more than once in the second argument string, then the first occurrence determines the replacement character. If the third argument string is longer than the second argument string, then excess characters are ignored.  NOTE: The translate function is not a sufficient solution for case conversion in all languages. A future version of XPath may provide additional functions for case conversion.",
      "FUNCTION_TRUE_DESC_KEY" : "This function returns true.",

      "FUNCTION_CURRENT_DESC_KEY" :
        "This function returns a node-set that has the current node as its only member. For an outermost expression (an expression not occurring within another expression), the current node is always the same as the context node.",
      "FUNCTION_GENERATEID_DESC_KEY" :
        "This function returns a string that uniquely identifies the node in the argument node-set that is first in document order. The unique identifier must consist of ASCII alphanumeric characters and must start with an alphabetic character.",
      "FUNCTION_ABS_DESC_KEY" : "This function returns the absolute value of arg.",
      "FUNCTION_COMPARE_DESC_KEY" :
        "This function returns -1, 0, or 1, depending on whether the value of the comparand1 is respectively less than, equal to, or greater than the value of comparand2, according to the rules of the collation that is used.",
      "FUNCTION_CURRENTDATE_DESC_KEY" : "This function returns the current xs:date.",
      "FUNCTION_CURRENTDATETIME_DESC_KEY" : "This function returns the current xs:dateTime.",
      "FUNCTION_CURRENTGROUP_DESC_KEY" : "This function returns the current group when used in conjunction with a for-each-group XSL element.",
      "FUNCTION_CURRENTGROUPINGKEY_DESC_KEY" : "This function returns the current grouping key when used in conjunction with a for-each-group XSL element.",
      "FUNCTION_CURRENTTIME_DESC_KEY" : "This function returns the current xs:time.",
      "FUNCTION_ENDSWITH_DESC_KEY" :
        "This function returns an xs:boolean indicating whether or not the value of arg1 starts with a sequence of collation units that provides a match to the collation units of arg2 according to the collation that is used.",
      "FUNCTION_EXISTS_DESC_KEY": "Returns true if the argument is a non-empty sequence.",
      "FUNCTION_DATA_DESC_KEY": "Returns the result of atomizing a sequence. This process flattens arrays, and replaces nodes by their typed values.",
      "FUNCTION_LOWERCASE_DESC_KEY" :
        "This function returns the value of arg after translating every character to its lower-case value.",
      "FUNCTION_QNAME_DESC_KEY" :
        "This function returns an xs:QName with the namespace URI given in paramURI. If paramURI is the zero-length string or the empty sequence, it represents \"no namespace\"; in this case, if the value of paramQName contains a colon (:), an error is raised. The prefix (or absence of a prefix) in paramQName is retained in the returned xs:QName value. The local name in the result is taken from the local part of paramQName.",
      "FUNCTION_RESOLVEQNAME_DESC_KEY" :
        "This function returns an xs:QName value (that is, an expanded-QName) by taking an xs:string that has the lexical form of an xs:QName (a string in the form \"prefix:local-name\" or \"local-name\") and resolving it using the in-scope namespaces for a given element.",
      "FUNCTION_UPPERCASE_DESC_KEY" :
        "This function returns the value of arg after translating every character to its upper-case value.",
      "FUNCTION_YEARSFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the years component in the value of arg. The result is obtained by casting arg to an xs:yearMonthDuration and then computing the years component.",
      "FUNCTION_MONTHSFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the months component in the value of arg. The result is obtained by casting arg to an xs:yearMonthDuration and then computing the months component.",
      "FUNCTION_DAYSFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the days component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component.",
      "FUNCTION_HOURSFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the hours component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component.",
      "FUNCTION_MINUTESFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the minutes component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component.",
      "FUNCTION_SECONDSFROMDURATION_DESC_KEY" :
        "This function returns an xs:integer representing the seconds component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component.",
      "FUNCTION_YEARFROMDATETIME_DESC_KEY" :
        "This function returns an xs:integer representing the year component in the localized value of arg. The result may be negative.",
      "FUNCTION_YEARMONTHDURATION_DESC_KEY" :
        "This function converts its argument to a yearMonthDuration.",
      "FUNCTION_MONTHFROMDATETIME_DESC_KEY" :
        "This function returns an xs:integer between 1 and 12, both inclusive, representing the month component in the localized value of arg.",
      "FUNCTION_DAYFROMDATETIME_DESC_KEY" :
        "This function returns an xs:integer between 1 and 31, both inclusive, representing the day component in the localized value of arg.",
      "FUNCTION_HOURSFROMDATETIME_DESC_KEY" :
        "This function returns an xs:integer between 0 and 23, both inclusive, representing the hours component in the localized value of arg.",
      "FUNCTION_MINUTESFROMDATETIME_DESC_KEY" :
        "This function returns an xs:integer value between 0 and 59, both inclusive, representing the minute component in the localized value of arg.",
      "FUNCTION_SECONDSFROMDATETIME_DESC_KEY" :
        "This function returns an xs:decimal value greater than or equal to zero and less than 60, representing the seconds and fractional seconds in the localized value of arg.",
      "FUNCTION_TIMEZONEFROMDATETIME_DESC_KEY" :
        "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence.",
      "FUNCTION_YEARFROMDATE_DESC_KEY" :
        "This function returns an xs:integer representing the year in the localized value of arg. The value may be negative.",
      "FUNCTION_MONTHFROMDATE_DESC_KEY" :
        "This function returns an xs:integer between 1 and 12, both inclusive, representing the month component in the localized value of arg.",
      "FUNCTION_DAYFROMDATE_DESC_KEY" :
        "This function returns an xs:integer between 1 and 31, both inclusive, representing the day component in the localized value of arg.",
      "FUNCTION_TIMEZONEFROMDATE_DESC_KEY" :
        "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence.",
      "FUNCTION_HOURSFROMTIME_DESC_KEY" :
        "This function returns an xs:integer between 0 and 23, both inclusive, representing the value of the hours component in the localized value of arg.",
      "FUNCTION_MINUTESFROMTIME_DESC_KEY" :
        "This function returns an xs:integer value between 0 and 59, both inclusive, representing the value of the minutes component in the localized value of arg.",
      "FUNCTION_SECONDSFROMTIME_DESC_KEY" :
        "This function returns an xs:decimal value greater than or equal to zero and less than 60, representing the seconds and fractional seconds in the localized value of arg.",
      "FUNCTION_TIMEZONEFROMTIME_DESC_KEY" :
        "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence.",
      "FUNCTION_ADJUSTDATETIMETOTIMEZONE_DESC_KEY" :
        "This function adjusts an xs:dateTime value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:dateTime without a timezone. Otherwise, returns an xs:dateTime with a timezone.  If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context.",
      "FUNCTION_ADJUSTDATETOTIMEZONE_DESC_KEY" :
        "This function adjusts an xs:date value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:date without a timezone. Otherwise, returns an xs:date with a timezone. For purposes of timezone adjustment, an xs:date is treated as an xs:dateTime with time 00:00:00.  If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context.",
      "FUNCTION_ADJUSTTIMETOTIMEZOME_DESC_KEY" :
        "This function adjusts an xs:time value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:time without a timezone. Otherwise, returns an xs:time with a timezone. If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context.",
      "FUNCTION_IMPLICITTIMEZONE_DESC_KEY" :
        "This function returns the value of the implicit timezone property from the dynamic context.",
      "FUNCTION_INTEGER_DESC_KEY" : "This function converts its argument to an integer.",
      "FUNCTION_DATE_DESC_KEY" : "This function converts its argument to a date.",
      "FUNCTION_DOUBLE_DESC_KEY" : "This function converts its argument to a double.",
      "FUNCTION_DURATION_DESC_KEY" : "This function converts its argument to a duration.",
      "FUNCTION_DAYTIMEDURATION_DESC_KEY" : "This function converts its argument to a dayTimeDuration.",
      "FUNCTION_TIME_DESC_KEY" : "This function converts its argument to a time.",
      "FUNCTION_DATETIME_DESC_KEY" : "This function converts its argument to a datetime.",
      "FUNCTION_DECIMAL_DESC_STR" : "This function converts its argument to a decimal.",
      "FUNCTION_NODESET_FROM_DELIMSTRING_DESC_KEY" : "Returns a delimited string created from nodeSet delimited by delimiter. Usage: oraext:create-delimited-string(nodeSet as node-set, delimiter as string)",
      "FUNCTION_GENERATE_GUID_DESC_KEY" : "Returns a GUID of fixed 32 characters in length.",
      "FUNCTION_LOOKUP_XML_DESC_KEY" : "This function returns the string value of an element defined by lookupXPath in an XML file (docURL) given its parent XPath (parentXPath), the key XPath (keyXPath), and the value of the key (key)",
      "FUNCTION_PARSE_ESCA_XML_DESC_KEY" : "This function parses an XML string to an XML element. The signature of this function is oraext:parseEscapedXML(xmlString as String).",
      "FUNCTION_PARSE_XML_DESC_KEY" : "This function parses a string to a DOM element. Usage: oraext:parseXML(xmlString as String)",
      "FUNCTION_MAX_NODESET_DESC_KEY" : "This function returns the maximum value from a list of input numbers, the node set inputNumber.The node set inputNumber can be a collection of text nodes or elements containing text nodes. In the case of elements, the first text node's value is considered. Usage: oraext:max-value-among-nodeset(inputNumber as node-set)",
      "FUNCTION_MIN_NODESET_DESC_KEY" : "This function returns the minimum value from a list of input numbers, the node set inputNumber.The node set inputNumber can be a collection of text nodes or elements containing text nodes. In the case of elements, the first text node's value is considered. Usage: oraext:min-value-among-nodeset(inputNumbers as node-set)",
      "FUNCTION_SQUARE_ROOT_DESC_KEY" : "This function returns the square root of inputNumber. Usage: oraext:square-root(inputNumber as number)",
      "FUNCTION_COMPARE_IGNORE_CASE_DESC_KEY" : "This function returns the lexicographical difference between inputString and compareString while ignoring case and comparing the unicode value of each character of both the strings. This function returns -1 if inputString lexicographically precedes the compareString. This function returns 0 if both inputString and compareString are equal. This function returns 1 if inputString lexicographically follows the compareString. Usage: oraext:compare-ignore-case(inputString as string, compareString as string)",
      "FUNCTION_CREATE_DELIM_STRING_CASE_DESC_KEY" : "This function returns a delimited string created from nodeSet delimited by a delimiter. Usage: oraext:create-delimited-string(nodeSet as Nodeset, delimiter as string)",
      "FUNCTION_FORMAT_STRING_CASE_DESC_KEY" : "This function returns the message formatted with the arguments passed. At least one argument is required and supports up to a maximum of 10 arguments. Usage: oraext:format-string(messageToFormat as string, arg1 as string, arg2 as string, arg3 as string, arg4 as string, arg5 as string, arg6 as string, arg7 as string, arg8 as string, arg9 as string)",
      "FUNCTION_GET_CONTENT_STRING_DESC_KEY" : "This function returns the XML representation of the input element. Usage: oraext:get-content-as-string(element as node-set)",
      "FUNCTION_GET_LOCALIZED_STRING_DESC_KEY" : "This function returns the locale-specific string for the key. This function uses language, country, variant, and resource bundle to identify the correct resource bundle. All parameters must be in string format. Use the string() function to convert any parameter values to strings before sending them to get-localized-string. Usage: oraext:get-localized-string(resourceBaseURL as string, resourceLocation as string, resourcebundle as string, language as string, country as string, variant as string, key as string)",
      "FUNCTION_INDEX_WITHIN_STRING_DESC_KEY" : "This function returns the zero-based index of the first occurrence of searchString within the inputString. This function returns -1 if searchString is not found. Usage: oraext:index-within-string(inputString as string, searchString as string)",
      "FUNCTION_LAST_INDEX_WITHIN_STRING_DESC_KEY" : "This function returns the zero-based index of the last occurrence of searchString within the inputString. This function returns -1 if searchString is not found.","FUNCTION_LAST_INDEX_WITHIN_STRING_DESC_KEY" : "This function returns the zero-based index of the last occurrence of searchString within the inputString. This function returns -1 if searchString is not found. Usage: oraext:last-index-within-string(inputString as string, searchString as string)",
      "FUNCTION_LEFT_TRIM_DESC_KEY" : "This function returns the value of inputString after removing all the leading white spaces. Usage: oraext:left-trim(input-string as string)",
      "FUNCTION_RIGHT_TRIM_DESC_KEY" : "This function returns the value inputString after removing all the trailing white spaces. Usage: oraext:right-trim(inputString as string)",
      "FUNCTION_DECODE_DESC_KEY" : "The method decodes the inputString which is encoded previously using Base64 encoding scheme and returns the decoded value",
      "FUNCTION_ENCODE_DESC_KEY" : "The method encodes the inputString using Base64 encoding scheme and returns the encoded value",
      "FUNCTION_DOCUMENT_DESC_KEY" : "This function allows access to XML documents other than the main source document.",
      "FUNCTION_ELEMENT_AVAILABLE_DESC_KEY" : "This function checks if the expanded-name is the name of an instruction", 
      "FUNCTION_FORMAT_NUMBER_DESC_KEY" : "This function converts its first argument to a string using the format pattern string specified by the second argument and the decimal-format named by the third argument, or the default decimal-format, if there is no third argument", 
      "FUNCTION_FUNCTION_AVAILABLE_DESC_KEY" : "This function checks if the expanded-name is the name of a function in the function library", 
      "FUNCTION_KEY_DESC_KEY" : "This functions selects elements by their keys", 
      "FUNCTION_SYSTEM_PROPERTY_DESC_KEY" : "This function returns an object representing the value of the system property identified by the name", 
      "FUNCTION_UNPARSED_ENTITY_URI_DESC_KEY" : "This function returns the URI of the unparsed entity with the specified name in the same document as the context node. It returns the empty string if there is no such entity.",     
      "FUNCTION_DISTINCT_VALUES_DESC_KEY" : "This function returns the values that appear in a sequence, with duplicates eliminated.",
      "FUNCTION_LOOKUP_VALUE_DESC_KEY" : "This function returns a string by looking up the value for the target column in a domain value map, where the source column contains the given source value.",
      "FUNCTION_GET_FLOW_ID_KEY" : "This function returns ICS Flow-Id",
      "FUNCTION_IS_REPLAYED_DESC_KEY" : "This function returns true if the executing instance was triggered through a replay.",
      "FUNCTION_GET_FAULT_STRING_KEY" : "This function returns the fault as a string value.",
      "FUNCTION_GET_FAULT_XML_KEY" : "This function returns the fault as an XML element.",
      "FUNCTION_GET_FAULT_ACTION_KEY" : "This function returns the fault of the action",
      "FUNCTION_GET_FAULT_NAME_KEY" : "This function returns the fault name.",
      //********************************************************************************
      // XSLT Processing Instructions Layer (reading, adding, removing): 00000 - 00099
      //********************************************************************************        
      "JETMAPPER-00003" : "An error occurred during the reading of the xslt processing instructions. For the map: ''{0}''",
      "JETMAPPER-00006" : "An error occurred while trying to get the sources of the map ''{0}''.",
      "JETMAPPER-00007" : "An error occurred while trying to get the target of the map ''{0}''.",          
      "JETMAPPER-00008" : "An error occurred while trying to get the document for the following ''{0}'' map. The exception is ''{1}''.",
      "JETMAPPER-00009" : "The source passed in is not a primary source.",
      "JETMAPPER-00010" : "An error occurred refreshing the state info during the update of the primary source in the ''{0}'' map.",
      "JETMAPPER-00011" : "An error occurred during the update of primary source in the ''{0}''map.",           
      "JETMAPPER-00012" : "An error occurred during the addition of a secondary source in the ''{0}''map. The exception is: {1}",
      "JETMAPPER-00013" : "An error occurred refreshing the state info during the addition of a secondary parameter in the ''{0}'' map. The exception is: {1}",
      "JETMAPPER-00014" : "An error occurred during the removal of a secondary source in the ''{0}''map. The exception is: {1}",
      "JETMAPPER-00015" : "An error occurred refreshing the state info during the removal of a secondary parameter in the ''{0}'' map. The exception is: {1}",
                  
      "JETMAPPER-00112" : "Source URI is invalid or cannot be found",           
      "JETMAPPER-00113" : "The document could not be retrieved for the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00114" : "The document could not be retrieved for the ''{0}'' map. The exception is: ",
      "JETMAPPER-00115" : "The URI passed is null.",
      "JETMAPPER-00116" : "The Locale passed is null.",
      "JETMAPPER-00117" : "An error occurred while trying to determine the document type.  The exception is a ''{0}'' : ",
      "JETMAPPER-00118" : "An error occurred while trying to format the XML.  The exception is: ",
      "JETMAPPER-00119" : "The parameter name cannot be blank or null when adding a secondary source.",
      "JETMAPPER-00120" : "Mapper does not currently support creating a param with a namespace. Please populate the QName with a localPart only.",
      "JETMAPPER-00121" : "The oracle-xsl-mapper XSLT Processing Instructions are required.",
      "JETMAPPER-00122" : "There was an exception while trying to read the sources of the document. The exception is: {0}",
      "JETMAPPER-00123" : "There is no primary source for the ''{0}'' map. A map should always have a primary source.",
      "JETMAPPER-00124" : "There was an exception while trying to read the target of the document. The exception is: ",
      "JETMAPPER-00125" : "There was an exception while trying to create the target of the document. The exception is: {0}",
      "JETMAPPER-00126" : "There was an exception while trying to save the ''{0}'' map after trying to add a new stylesheet parameter. The exception is a ''{1}'': ",
      "JETMAPPER-00127" : "There was an exception while trying to save the ''{0}'' map after trying to add a new stylesheet parameter. The exception is: ",
      "JETMAPPER-00128" : "A stylesheet parameter can only be added to a map that is using the 12c format. Open the ''{0}'' map in Jdeveloper and convert the current format to the 12c format.",
      "JETMAPPER-00129" : "The source passed in is a primary source. Only stylesheet parameters (or secondary sources) can be added to the ''{0}'' map.",
      "JETMAPPER-00130" : "A stylesheet parameter already exists with the name ''{0}'' in the ''{1}'' map. In order to add a new stylesheet parameter the name must be unique.",
      "JETMAPPER-00131" : "A stylesheet parameter could not be added to the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00132" : "A stylesheet parameter can only be removed from a map that is using the 12c format. Open the ''{0}'' map in Jdeveloper and convert the current format to the 12c format.",
      "JETMAPPER-00133" : "The source passed in is a primary source. Only stylesheet parameters (or secondary sources) can be removed from the ''{0}'' map.",
      "JETMAPPER-00134" : "A stylesheet parameter could not be removed from the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00135" : "A stylesheet parameter could not be removed from the ''{0}'' map. The exception is: ",
      "JETMAPPER-00136" : "A schema specification does not exist in the ''{0}'' map.",
      "JETMAPPER-00137" : "The URI is malformed and cannot be read. The URI with the issue is ''{0}''.",
      "JETMAPPER-00138" : "A severe error has occurred while trying to load the processing instructions of the ''{0}'' map. While trying to read the document, the exception is: ",
      "JETMAPPER-00139" : "A severe error has occurred while trying to load the processing instructions of the ''{0}'' map. While trying to read the document, the exception is ''{1}'': ",
      "JETMAPPER-00140" : "A severe error has occurred while trying to load the processing instructions of the ''{0}'' map. While trying to read the 12c format processing instructions, the exception is ''{1}'': ",
      "JETMAPPER-00141" : "A severe error has occurred while trying to load the processing instructions of the ''{0}'' map. While trying to read the 11g format processing instructions, the exception is ''{1}'': ",
      "JETMAPPER-00142" : "The ''{0}'' xsl has invalid processing instructions. There are no sources or targets found.",
      "JETMAPPER-00143" : "The ''{0}'' file is not a valid xsl file.",
      "JETMAPPER-00144" : "An exception occurred while trying to get the document from MDS for the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00145" : "An exception occurred while trying to get the document from MDS for the ''{0}'' map. The exception is: ",
      "JETMAPPER-00146" : "An exception occurred while trying to parse the document for the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00147" : "An exception occurred while trying to get the input stream of the document for the ''{0}'' map. The exception is a ''{1}'': ",
      "JETMAPPER-00148" : "An error occurred while trying to get the MapInputTarget. ",
      "JETMAPPER-00149" : "An error occurred while trying to get the MapInputSource. ",
      "JETMAPPER-00150" : "Primary Source could not be replaced in the ''{0}'' map.", 
      "JETMAPPER-00151" : "An error occurred while trying to write the document for the following: ''{0}''. The exception is : {1}",
      "JETMAPPER-00152" : "An error occurred while trying to write the document for the following: ''{0}''. The exception is : ''{1}'' : ",
      "JETMAPPER-00153" : "An xsl:template element is not found for the document.",
      "JETMAPPER-00154" : "There are no xsl:param elements found for the document.",
      "JETMAPPER-00155" : "There is no matching xsl:param element for the ''{0}'' parameter passed in.",
      "JETMAPPER-00156" : "An error occurred while trying to format the XML.  The exception is a ''{0}'' : ",
      "JETMAPPER-00157" : "NamespaceURI Is Null, Cannot add Null namespace to stylesheet",
      "JETMAPPER-00158" : "The document does not have 'stylesheet' or 'transform' node as root. The root is: ''{0}''",
      "JETMAPPER-00159" : "Unable to parse the XSLT operators document. URL attempted to parse is: {0}",
      "JETMAPPER-00160" : "Unable to parse the XSLT keywords document. URL attempted to parse is: {0}",
      "JETMAPPER-00161" : "Unable to parse the XSLT functions document. URL attempted to parse is: {0}",
      "JETMAPPER-00162" : "Unable to parse the document. URL attempted to parse is: {0}",
      "JETMAPPER-00163" : "Target URI is Invalid or Cannot Be Found",
      //********************************************************************************
      // Validations : 00300 - 00399
      //********************************************************************************
      //These Messges MUST Match up to the JETMapperBundleClient.java
      "JETMAPPER-00299" : "Mapping for Target is not valid.  Click here for more details",
      "JETMAPPER-00300" : "Mapping for Target is not valid.  Click here for more details. Target: {0}",
      "JETMAPPER-00312" : "Above Source Element, used in the mapping, does not exist. Use the expression builder to correct the mapping.",
      "JETMAPPER-00301" : "Mapping is not associated with a valid target schema.",
      "JETMAPPER-00302" : "The expression is unknown. {0}.  Use the expression builder to correct the mapping.",
      "JETMAPPER-00303" : "Target root element is invalid.",
      "JETMAPPER-00304" : "Function is missing required number of parameters: {0}",
      "JETMAPPER-00305" : "Function contains too many parameters: {0}",
      "JETMAPPER-00306" : "Function not found: {0}",
      "JETMAPPER-00307" : "{0} missing required attribute: {1}",
      "JETMAPPER-00308" : "<xsl:choose> statement is missing a required <xsl:when>",
      "JETMAPPER-00309" : "<xsl:when> statement is missing a required <xsl:choose>",
      "JETMAPPER-00310" : "<xsl:otherwise> statement is missing a required <xsl:choose>",
      "JETMAPPER-00311" : "<xsl:otherwise> statement is missing a required <xsl:when>",
      "JETMAPPER-00313" : "Unsupported data type for operand used in addition operation: {0}",
      "JETMAPPER-00314" : "The namespace/namespace prefix is not recognized. {0}",
      "JETMAPPER-00315" : "Invalid return type of the expression as return type must be node or node-set",
      
      
      
      //********************************************************************************
      // WSDL and Schema Parser Processing Layer: 00400-00499
      //********************************************************************************
      "JETMAPPER-00400" : "The Document is empty. It has zero bytes.",
      "JETMAPPER-00401" : "The XSD URI passed into the method is null",
      //********************************************************************************
      // MDS Manager Layer: 00800-00899
      //********************************************************************************
      "JETMAPPER-00801" : "MDSSession is Null, we cannot determine if a file is customized without an mdsSession.",
      "JETMAPPER-00802" : "The creation of MDSManager failed because of an MDSException.",
      "JETMAPPER-00803" : "Building the xsl document from MDS failed because of an exception.",
      "JETMAPPER-00804" : "Building the xsl document from Input Stream failed because of an exception.",
      "JETMAPPER-00805" : "There is no MDS Session so the customizations cannot be removed.",
      "JETMAPPER-00806" : "Unabe to cancel changes to an MDS session. Reason is {0}.",
      "JETMAPPER-00807" : "Unabe to save changes to an MDS session. Reason is {0}.",
      "JETMAPPER-00808" : "MDS Metadata Object is Null", 
      
      //********************************************************************************
      // General Exceptions: 00900-00999
      //********************************************************************************
      "JETMAPPER-00900" : "An undefined exception happened.",
      "JETMAPPER-00901" : "Exception occurred when trying to determine whether to display the lookup table or not",
      "JETMAPPER-00902" : "JETMapper class has not been instantiated. Cannot call getMapperStateInfo without first having an instance of jetmapper.",
      "JETMAPPER-00903" : "JETMapper class has not been instantiated. Cannot call refreshStateInfo without first having an instance of jetmapper.",
      "JETMAPPER-00904" : "Stylesheet parameters cannot be added to or removed from an imported map.",
      "JETMAPPER-00905" : "Map does not contain any templates.",
      "JETMAPPER-00906" : "An error occurred during the refresh of the state info file for {0} .",
      "JETMAPPER-00907" : "An error occurred persisting the state info file during the refresh for {0} .",
      "JETMAPPER-00908" : "An error occurred initializing the state info file during the creation of the JETMapper object.",
      "JETMAPPER-00909" : "Error parsing the expression. Error is {0}",
      "JETMAPPER-00910" : "JETMapper adapter has not been creted. Error is {0}",
      "JETMAPPER-00911" : "There is an error saving the xsl document. Error is {0}",
      "JETMAPPER-00912" : "There is an error saving the StateInfo document. Error is {0}",
      "JETMAPPER-00913" : "Error adding or removing stylesheet param : {0}.",
      "JETMAPPER-00914" : "The value for the parameter 'srcValue' should be a source field or an expression.",
      "JETMAPPER-00915" : "Data type ''{0}'' is invalid for the source URI ''{1}''",
      "JETMAPPER-00916" : "Data type ''{0}'' is invalid for the target URI ''{1}''",
      "JETMAPPER-00917" : "The value for the first parameter of the lookupValue function should not contain the path for the chosen lookup table or the extension. The param value should be the name of the lookup table only",
          
      //*******************************************************************
      //******************  Generate New XSL messages : 01001-01099 **********
      //*******************************************************************
      "JETMAPPER-01001" : "Map input URI is Null",
      "JETMAPPER-01002" : "Map input URI ''{0}'' is Not Absolute",
      "JETMAPPER-01003" : "Operation name is Null",
      "JETMAPPER-01004" : "Part name is Null",
      "JETMAPPER-01005" : "Data type name is Null",
      "JETMAPPER-01006" : "Root element name is Null",
      "JETMAPPER-00053" : "Function is not supported: ''{0}''",
      "JETMAPPER-00054" : "Imported document is not XSLT version 2.0",
      "JETMAPPER-00055" : "Imported document has processing instructions that are either invalid or missing",
      "JETMAPPER-00056" : "Import does not support xslt documents that have imports and/or includes statements",
      "JETMAPPER-00057" : "The specification of map sources and targets is incorrect.  Please ensure the oracle-xsl-mapper:schema section in the map file being imported is exactly the same as the previously exported map file.",
      "JETMAPPER-00058" : "This source from the imported map doesn't match any of the given sources. ROOT: {0}, NAMESPACE: {1}, LOCATION: {2}, TYPE: {3}, PARAMETER: {4}",
      "JETMAPPER-00059" : "The imported map is missing the given target. ROOT: {0}, NAMESPACE: {1}, LOCATION: {2}, TYPE: {3} ",
      "JETMAPPER-00060" : "Exception in creating new xsl while creating processing instructions",
      "JETMAPPER-00061" : "The list of namespaces is null",
      "JETMAPPER-00062" : "There must be at least one primary source.",
      "JETMAPPER-00063" : "There must be at least one source.",
      "JETMAPPER-00064" : "There cannot be more than one primary source.",
      "JETMAPPER-00065" : "The secondary sources have duplicate parameter names.",
      "JETMAPPER-00066" : "A parameter name for a secondary source contains invalid special characters. Parameter: {0} ",
      "JETMAPPER-00067" : "There must be a target.",
      "JETMAPPER-00068" : "Source URI is Null",
      "JETMAPPER-00069" : "Source URI is Not Absolute",
      "JETMAPPER-00070" : "Target URI is Null",
      "JETMAPPER-00071" : "Target URI is Not Absolute", 
      "JETMAPPER-00072" : "Target Root Element is Null",
      "JETMAPPER-00073" : "Source Root Element is Null",
      "JETMAPPER-00074" : "Root Element Name ''{0}'' and Namespace ''{1}'' Pairing is Invalid.",
      "JETMAPPER-00075" : "Root Element is Invalid for the Source URI ''{0}''",
      "JETMAPPER-00076" : "Root Element is Invalid for the Target URI ''{0}''",
      "JETMAPPER-00077" : "No schemas (imported or inline) are found in the ''{0}'' WSDL",
      "JETMAPPER-00078" : "Error Generating New Xsl for Source URI ''{0}''. The schema is not accessible or is invalid.",
      "JETMAPPER-00079" : "Error Generating New Xsl for Target URI ''{0}''. The schema is not accessible or is invalid.",
  
      // REFACTOR XPATH MESSAGES
      "JETMAPPERC-00000": "Mappings adjusted",
      "JETMAPPERC-00001": "Child mappings were automatically adjusted due to changes to the for-each statement.",
      "JETMAPPERC-00002": "Error adjusting mappings",
      
      // TEST MAP 00000 - 00099
      "JETMAPPERC-00003": "Payload could not be generated for the '{0}' schema",
      "JETMAPPERC-00004": "An additional source payload is missing. Test will execute, but may produce unreliable results if there are mappings from this source.",
      "JETMAPPERC-00005":"Please enter the input payload here or click Generate Inputs to automatically create payloads.Missing payloads will be automatically generated on click of Execute.",
      "JETMAPPERC-00006": "Click Execute to see results.",
      "JETMAPPERC-00007": "Error generating inputs.",
      "JETMAPPERC-00008": "Error executing XSL.",
      "JETMAPPERC-00009": "There are some Function(s) used in Mapping that currently can not be tested in Test Mapper UI. Run time transformation will execute the function(s) properly.",
      "JETMAPPERC-00010": "Generate Inputs will override the existing payload(s).",
      "JETMAPPERC-00011": "Error occurred : ",
      "JETMAPPERC-00012": "Error occurred : Execute XSL is down please try after some time",
      // TRANSACTION/TransEdit MESSAGES 00100 - 00199
      "JETMAPPERC-00101": "Aborting all further updates to server, save map and reload.",
      "JETMAPPERC-00102": "No modifications are allowed.",
      "JETMAPPERC-00103": "Error has occurred updating backend, please save and reload map.",
      "JETMAPPERC-00104": "Error saving edits to backend, save and reload map",
      "JETMAPPERC-00105": "Error has occurred, please save and reload map.",
      "JETMAPPERC-00106": "doc is not an instanceof Document",
      "JETMAPPERC-00107": "JS Error during execute",
      "JETMAPPERC-00108": "Error has occurred while updating data in backend. Please review/validate your last operation and try again.",
      // CANVAS MESSAGES 00200 - 00299
      "JETMAPPERC-00201": "", //OPEN USE THIS
      "JETMAPPERC-00202": "", //OPEN USE THIS
      "JETMAPPERC-00203": "There was a severe error loading the map. Switched to read only code view. The exception is: {0}",
      "JETMAPPERC-00204": "Error executing undo on backend, save map and reload",
      "JETMAPPERC-00205": "Error executing redo on backend, save map and reload",
      "JETMAPPERC-00206": "No Lookups to Display in Lookup Browser",
      "JETMAPPERC-00207": "Schema View is unavailable when the root template rule is not match='/'",
      "JETMAPPERC-00208": "Schema View is unavailable when the XSLT file contains multiple template rules",
      "JETMAPPERC-00209": "Schema View is unavailable when the XSLT file contains named template rules",
      "JETMAPPERC-00210": "XSLT Mode has been set to support the mappings using <xsl:attribute>. Basic mode is disabled.",
      "JETMAPPERC-00211": "Error while updating child mappings for the expression contains operators within for-each. Please review and manually adjust these mappings if necessary.",        
      "JETMAPPERC-00212": "This map cannot be loaded in graphical view",
      "JETMAPPERC-00213": "Designer view is unavailable. The XSLT file contains constructs not editable in Designer view : {0}",
      "JETMAPPERC-00214": "An error occurred while preparing mapper editor.",
      "JETMAPPERC-00215": "An error occurred while loading the mapper editor. Please exit the map editor and try again",
      "JETMAPPERC-00216": "An error occurred while loading the map",
      
      // RECOMMENDATION MESSAGES 00400 - 00450 
      "JETMAPPERC-00400": "An error occured while loading recommendations. Please try again.",
      "JETMAPPERC-00401": "No Recommendations were available from Recommend Engine.",
      "JETMAPPERC-00403": "Recommendations may have already been mapped.",    
      "JETMAPPERC-00404": "Recommendations Applied",
      "JETMAPPERC-00405": "All selected recommendations have been applied.",                
      "JETMAPPERC-00406": "Error Applying Recommendations",
      "JETMAPPERC-00407": "An error occurred while trying to apply the selected recommendations.",     
      "JETMAPPERC-00408": "No Selections",     
      "JETMAPPERC-00409": "No records are selected.", 
      "JETMAPPERC-00410": "Recommendations cannot be done when there are mappings in error. Fix the mapping errors then try again.",
      "JETMAPPERC-00411": "Recommendations cannot be done.",
      "RECOMMEND_DLG_OK": "Recommend",
      "APPLY_RECOMMEND_DLG_OK": "Apply",
      //********************************************************************************
      // Imported text from JDev XSLT Editor
      //********************************************************************************
      "TX_MULTI_CONTEXT_WARNING" : "Context Warning",
      "TX_MULTI_CAUSE" : "Cause: ",
      "TX_MULTI_TARGET_TREE_WARNING" : "Target Tree Execution Warning",
      "TX_MULTI_EXECUTION_TREE_WARNING" : "Execution Tree Warning",
      "TX_MULTI_COMPLEX_XSLT_WARNING" : "Due to complexity or errors in XSLT, the editor cannot determine context nodes and/or target tree elements in xslt.  You may continue editing, but should manually verify any xpath expressions generated by the editor, e.g. through drag and drop.",
      "GUI_MM_ERR_SRC_SCHEMA" : "Failed to open the source schema:",
      "GUI_MM_ERR_TRG_SCHEMA" : "Failed to open the target schema:",
      "GUI_MM_ERR_SRC_PARAM_SCHEMA" : "Failed to open schema for parameter:",
      "TX_MULTI_ERROR" : "Error:",
      "TX_MULTI_NO_NAMED_TEMPLATE" : "Named template {0} does not exist.",
      "TX_MULTI_IMPORT_ERROR" : "Import/Include error: {0}",
      "TX_MULTI_RECURSIVE_CALL" : "Recursive call to named template {0}",

      "UI_VIEW_ONLY" : "View only",
      "SWITCH_TO_DES_VIEW" : "Switch to Design View",
      "SWITCH_TO_DEV_VIEW" : "Switch to Developer View",
      "EXTENDED_DT_UF_ADJEC" : " extends ",
      "DEVELOPER_VIEW" : "Developer",
      "CODE_UNDO_LABEL": "Undo" ,
      "CODE_REDO_LABEL": "Redo",
      "CODE_SEARCH_LABEL": "Search" ,
      "CODE_SEARCH_NEXT_LABEL": "Search Next" ,
      "CODE_SEARCH_PREV_LABEL": "Search Previous" ,
      "CODE_FIND_REPLACE_LABEL": "Find and Replace" ,
      "CODE_GOTO_LABEL": "Goto Line" ,
                      // isDTR messages and Edited Source Code Validation
                      "JETMAPPER-00316": "Map cannot be rendered in Design because: It does no uses xsl as prefix for the XSLT Namespace",
                      "JETMAPPER-00317": "Map cannot be rendered in Design because: It uses Constructors not supported at Graphical Design: {0}",
                      "JETMAPPER-00318": "Map cannot be rendered in Design because: It only supports single <xsl:template match ='/'> pulling pattern",
                      "JETMAPPER-00319": "Map cannot be rendered in Design because: Multiple target elements are constrained by a single: {0}. Elements: {1}",
                      "JETMAPPER-00320": "Map cannot be rendered in Design because: {0}",
                      "JETMAPPER-00321": "Map cannot be rendered in Design due to unexpected Exception: {0}",
                      "JETMAPPER-00322": "Unable to Determine if the map could be rendered in design tab",
                      "JETMAPPER-00323": "xsl:stylesheet is missing a required attribute and its value: {0}",
                      "JETMAPPER-00324": "{0}",
                      /** Validate Import WEBMAPPER-9999 messages are converted into these ones for SourceCodeEditor.validateXSLT()
                       *  because the WEBMAPPER-9999 include the "import" word**/
                      "JETMAPPER-00325" /*"WEBMAPPER-00115"*/: "Only XSLT version 2.0  is supported" ,
                      "JETMAPPER-00326" /*"WEBMAPPER-00116"*/: "Map has processing instructions that are either invalid or missing" ,
                      "JETMAPPER-00327" /*"WEBMAPPER-00117",*/: "xsl:imports and/or xsl:includes statements are not supported" ,
                      "JETMAPPER-00328" /*"WEBMAPPER-00118"*/: "The specification of map sources and targets is incorrect. Please fix the oracle-xsl-mapper:schema processing instructions in the map " ,
                      "JETMAPPER-00329" /*"WEBMAPPER-00120"*/: "The processing instructions are missing the source. ROOT: {0}, NAMESPACE: {1}, LOCATION: {2}, TYPE: {3}, PARAMETER: {4}" ,
                      "JETMAPPER-00330" /*"WEBMAPPER-00121"*/: "This source from the processing instructions is not valid. ROOT: {0}, NAMESPACE: {1}, LOCATION: {2}, TYPE: {3}, PARAMETER: {4}" ,
                      "JETMAPPER-00331" /*"WEBMAPPER-00122"*/: "The Processing instructions are missing the target. ROOT: {0}, NAMESPACE: {1}, LOCATION: {2}, TYPE: {3} " ,
                      //TODO Review and correct duplicate entries
                      "JETMAPPER-00332": "The Processing instructions and xsl:param mismatch. Param: {0}" ,
                      "JETMAPPER-00333": "Function not supported. Function: {0}" ,
                      "JETMAPPERC-00332": "Recommendation Tab is not Supported for this map",
                      "JETMAPPERC-00333": "There are syntax errors in the edited code. Please fix them before navigating away from the tab",
                      "JETMAPPER-00334": "Unknown: {0}",
                      "JETMAPPER-00335": "Target Root Element not found in <xsl:template match = '/'> scope: {0}",
                      "JETMAPPER-00336": "Prefix is used but not declared: {0}",
                      "JETMAPPER-00337": "The number of child nodes under the expanded tree node is high. To load the further nodes progressively, please scroll down to the end of the tree. To quickly create or view mappings, XSLT constructs, use the code mode.",
      "MAP_LOOKUP_LABEL": "Map Lookup Value"
});

          

          
            
          
         
         
          
