/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define({
      "XSLT_FUNCTION_NAME": "Functions" , 
      "XSLT_OPERATOR_NAME": "Operators" , 
      "XSLT_KEYWORD_NAME": "XSL Constructors" ,
      "FUNCTION_PANEL_COMP_HEADER": "Components",
      "FUNCTION_SEARCH_PLACEHOLDER": "Search...",
      "FUNCTION_SEARCH_ERROR_NOT_FOUND": "Searched phrase not found :",
      "FUNCTION_SEARCH_WARNING": "Warning",
      "FUNCTION_HELP_LINK": "Learn more",
      "XSLT_FUNCTION_DESC_REQUIRED_KEY": "Required" ,
      "XSLT_FUNCTION_DESC_OPTIONAL_KEY": "Optional" ,
      "XSLT_KEYWORD_DESC_ATTRIBUTE": "The xsl:attribute element can be used to add attributes to result elements whether created by literal result elements in the stylesheet or by instructions such as xsl:element."   ,
      "XSLT_KEYWORD_DESC_ATTRIBUTE_NIL": "The attribute name='xsi:nil' element can be used to add xsi:nil attribute to the result elements."   ,
      "XSLT_KEYWORD_DESC_CHOOSE": "The xsl:choose element selects one among a number of possible alternatives. It consists of a sequence of xsl:when elements followed by an optional xsl:otherwise element."  ,
      "XSLT_KEYWORD_DESC_COPY_OF": "The xsl:copy-of element can be used to insert a result tree fragment into the result tree, without first converting it to a string as xsl:value-of does."  ,
      "XSLT_KEYWORD_DESC_FOREACH": " The xsl:for-each instruction contains a template, which is instantiated for each node selected by the expression specified by the select attribute. The select attribute is required. The expression must evaluate to a node-set."  ,
      "XSLT_KEYWORD_DESC_IF": "The xsl:if element has a test attribute, which specifies an expression. The content is a template. The expression is evaluated and the resulting object is converted to a boolean as if by a call to the boolean function. If the result is true, then the content template is instantiated; otherwise, nothing is created."  ,
      "XSLT_KEYWORD_DESC_OTHERWISE": "Used in conjunction with xsl:choose.  The content of the first, and only the first, xsl:when element whose test is true is instantiated. If no xsl:when is true, the content of the xsl:otherwise element is instantiated. "  ,
      "XSLT_KEYWORD_DESC_TEXT": "Literal data characters may also be wrapped in an xsl:text element."  ,
      "XSLT_KEYWORD_DESC_VALUEOF": "The xsl:value-of element is instantiated to create a text node in the result tree."  ,
      "XSLT_KEYWORD_DESC_VARIABLE": "The xsl:variable element can be used as a top-level element or within templates. A top-level variable-binding element declares a global variable that is visible everywhere."  ,
      "XSLT_KEYWORD_DESC_WHEN": "Used in conjunction with xsl:choose.  Each xsl:when element has a single attribute, test, which specifies an expression."  ,
      "XSLT_OPERATOR_DESC_ADDITION": "Adds 2 numbers."  ,
      "XSLT_OPERATOR_DESC_AND": "Returns true if both parameters evaluate to true; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_COMPUTE": "XPath union operator |. Computes the union of its operands, which must be node-sets."  ,
      "XSLT_OPERATOR_DESC_DIVISION": "Returns the first number divided by the second number."  ,
      "XSLT_OPERATOR_DESC_EQUAL": "Returns true if the two parameters are equal; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_GREATERTHAN": "Returns true if the first parameter is greater than the second parameter; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_GREATERTHANEQUAL": "Returns true if the first parameter is greater than or equals the second parameter; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_LESSTHAN": "Returns true if the first parameter is less than the second parameter; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_LESSTHANEQUAL": "Returns true if the first parameter is less than or equals the second parameter; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_MODULUS": "Returns the remainder from a truncating division."  ,
      "XSLT_OPERATOR_DESC_MULTIPLICATION": "Multiplies 2 numbers."  ,
      "XSLT_OPERATOR_DESC_NOTEQUAL": "Returns true if the two parameters not are equal; returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_OR": "Returns true if either parameters evaluate to true. Returns false otherwise."  ,
      "XSLT_OPERATOR_DESC_SUBTRACT": "Subtracts the second number from the first number."  ,
      "XSLT_OPERATOR_DESC_UNARY": "Returns the negative value of the number" ,
    /* *****************  Recommend Translations *******************************/
      "RECOMMEND_CHOICESOURCE_ORACLE": "Oracle"  ,
      "RECOMMEND_CHOICESOURCE_CUSTOMER": "Customer"  ,
      "RECOMMEND_CHOICESOURCE_INFERENCE": "Inference"  ,
      "RECOMMEND_CHOICESOURCE_AUTO": "Auto Mapper"  ,      
    /* *****************  Category Translations *******************************/
      "CATEGORY_ADVANCED_KEY": "Advanced"  ,
      "CATEGORY_BOOLEAN_KEY": "Boolean"  ,
      "CATEGORY_CONVERSION_KEY": "Conversion"  ,   
      "CATEGORY_DATE_KEY": "Date"  ,   
      "CATEGORY_DVM_KEY": "DVM"  ,
      "CATEGORY_MATHEMATICAL_KEY": "Mathematical"  ,   
      "CATEGORY_NODESET_KEY": "Node-set"  ,
      "CATEGORY_STRING_KEY": "String"  ,   
      "CATEGORY_XREF_KEY": "XREF"  ,
      "CATEGORY_USERDEFINED_KEY": "User Defined"  ,   
      "CATEGORY_ICS_KEY": "Integration Cloud"  ,
      "CATEGORY_SOA_KEY": "SOA"  ,   
      "CATEGORY_SERVICEBUS_KEY": "Service Bus"  ,
      "CATEGORY_DATABASE_KEY": "Database"  ,   
      "CATEGORY_MEDIATOR_KEY": "Mediator"  ,
      "CATEGORY_GENERAL_KEY": "General"  ,   
      "CATEGORY_FUNCTIONS_KEY": "Functions"  ,
      "CATEGORY_OPERATORS_KEY": "Operators"  ,   
      "CATEGORY_XSLELEMENTS_KEY": "XSL Elements"  ,
      "CATEGORY_XSLTINFO_KEY": "XSLT Info"  ,
      "CATEGORY_XSLT_OUTPUT": "Output"  ,
      "CATEGORY_XSLT_FLOW_CONTROL": "Flow Control"  ,
    //Use this category header once 'parameters' are allowed as xslt keywords.
    //  "CATEGORY_XSLT_VARIABLES_PARAMETERS": "Variables and Parameters"  , 
      "CATEGORY_XSLT_VARIABLES_PARAMETERS": "Variables"  ,
      "CATEGORY_XSLT_TEMPLATE_CONTROL": "Template Control"  ,
      "CATEGORY_XSLT_DECLARATIONS": "Declarations"  ,
      "CATEGORY_XSLT_ERROR_HANDLING": "Error Handling"  ,
    /* *****************  Function Description Translations *******************************/
      "FUNCTION_BOOLEAN_DESC_KEY": "This function converts its argument to a boolean."  ,
      "FUNCTION_CEILING_DESC_KEY":
      "This function returns the smallest (closest to negative infinity) number that is not less than the argument and that is an integer."  ,
      "FUNCTION_CONCAT_DESC_KEY": "This function returns the concatenation of its arguments."  ,
      "FUNCTION_CONTAINS_DESC_KEY":
      "This function returns true if the first argument string contains the second argument string, and otherwise returns false."  ,
      "FUNCTION_COUNT_DESC_KEY": "This function returns the number of nodes in the argument node-set."  ,
      "FUNCTION_FALSE_DESC_KEY": "This function returns false."  ,
      "FUNCTION_FLOOR_DESC_KEY":
      "This function returns the largest (closest to positive infinity) number that is not greater than the argument and that is an integer."  ,
      "FUNCTION_NAMESPACEURI_DESC_KEY":
      "This function returns the namespace URI of the expanded-name of the node in the argument node-set that is first in document order. If the argument node-set is empty, the first node has no expanded-name, or the namespace URI of the expanded-name is null, an empty string is returned. If the argument is omitted, it defaults to a node-set with the context node as its only member.  NOTE: The string returned by the namespace-uri function will be empty except for element nodes and attribute nodes."  ,
      "FUNCTION_LANG_DESC_KEY":
      "This function returns true or false depending on whether the language of the context node as specified by xml:lang attributes is the same as or is a sublanguage of the language specified by the argument string."  ,
      "FUNCTION_LAST_DESC_KEY":
      "This function returns a number equal to the context size from the expression evaluation context."  ,
      "FUNCTION_LOCALNAME_DESC_KEY":
      "This function returns the local part of the expanded-name of the node in the argument node-set that is first in document order. If the argument node-set is empty or the first node has no expanded-name, an empty string is returned. If the argument is omitted, it defaults to a node-set with the context node as its only member."  ,
      "FUNCTION_NAME_DESC_KEY":
      "This function returns a string containing a QName representing the expanded-name of the node in the argument node-set that is first in document order. The QName must represent the expanded-name with respect to the namespace declarations in effect on the node whose expanded-name is being represented. Typically, this will be the QName that occurred in the XML source. This need not be the case if there are namespace declarations in effect on the node that associate multiple prefixes with the same namespace. However, an implementation may include information about the original prefix in its representation of nodes; in this case, an implementation can ensure that the returned string is always the same as the QName used in the XML source. If the argument node-set is empty or the first node has no expanded-name, an empty string is returned. If the argument it omitted, it defaults to a node-set with the context node as its only member.\n" +
      "NOTE: The string returned by the name function will be the same as the string returned by the local-name function except for element nodes and attribute nodes."  ,
      "FUNCTION_NORMALIZESPACE_DESC_KEY":
      "This function returns the argument string with whitespace normalized by stripping leading and trailing whitespace and replacing sequences of whitespace characters by a single space. Whitespace characters are the same as those allowed by the S production in XML. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node."  ,
      "FUNCTION_NOT_DESC_KEY": "This function returns true if its argument is false, and false otherwise."  ,
      "FUNCTION_NUMBER_DESC_KEY":
      "This function converts its argument to a number. NOTE: The number function should not be used for conversion of numeric data occurring in an element in an XML document unless the element is of a type that represents numeric data in a language-neutral format (which would typically be transformed into a language-specific format for presentation to a user). In addition, the number function cannot be used unless the language-neutral format used by the element is consistent with the XPath syntax for a Number."  ,
      "FUNCTION_POSITION_DESC_KEY":
      "This function returns a number equal to the context position from the expression evaluation context."  ,
      "FUNCTION_ROUND_DESC_KEY":
      "This function returns the number that is closest to the argument and that is an integer.  NOTE: For these last two cases, the result of calling the round function is not the same as the result of adding 0.5 and then calling the floor function."  ,
      "FUNCTION_STARTSWITH_DESC_KEY":
      "This function returns true if the first argument string starts with the second argument string, and otherwise returns false."  ,
      "FUNCTION_STRING_DESC_KEY":
      "This function converts an object to a string. NOTE: The string function is not intended for converting numbers into strings for presentation to users."  ,
      "FUNCTION_STRINGLENGTH_DESC_KEY":
      "This returns the number of characters in the string. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node."  ,
      "FUNCTION_SUBSTRING_DESC_KEY":
      "This returns the number of characters in the string. If the argument is omitted, it defaults to the context node converted to a string, in other words the string-value of the context node."  ,
      "FUNCTION_SUBSTRINGAFTER_DESC_KEY":
      "This function returns the substring of the first argument string that follows the first occurrence of the second argument string in the first argument string, or the empty string if the first argument string does not contain the second argument string. For example, substring-after(\"1999/04/01\":\"/\") returns 04/01, and substring-after(\"1999/04/01\":\"19\") returns 99/04/01."  ,
      "FUNCTION_SUBSTRINGBEFORE_DESC_KEY":
      "This function returns the substring of the first argument string that precedes the first occurrence of the second argument string in the first argument string, or the empty string if the first argument string does not contain the second argument string. For example, substring-before(\"1999/04/01\":\"/\") returns 1999."  ,
      "FUNCTION_SUM_DESC_KEY":
      "This function returns the sum, for each node in the argument node-set, of the result of converting the string-values of the node to a number."  ,
      "FUNCTION_TRANSLATE_DESC_KEY":
      "This function returns the first argument string with occurrences of characters in the second argument string replaced by the character at the corresponding position in the third argument string. For example, translate(\"bar\":\"abc\":\"ABC\") returns the string BAr. If there is a character in the second argument string with no character at a corresponding position in the third argument string (because the second argument string is longer than the third argument string), then occurrences of that character in the first argument string are removed. For example, translate(\"--aaa--\":\"abc-\":\"ABC\") returns \"AAA\". If a character occurs more than once in the second argument string, then the first occurrence determines the replacement character. If the third argument string is longer than the second argument string, then excess characters are ignored.  NOTE: The translate function is not a sufficient solution for case conversion in all languages. A future version of XPath may provide additional functions for case conversion."  ,
      "FUNCTION_TRUE_DESC_KEY": "This function returns true."  ,
      "FUNCTION_CURRENT_DESC_KEY":
      "This function returns a node-set that has the current node as its only member. For an outermost expression (an expression not occurring within another expression), the current node is always the same as the context node."  ,
      "FUNCTION_GENERATEID_DESC_KEY":
      "This function returns a string that uniquely identifies the node in the argument node-set that is first in document order. The unique identifier must consist of ASCII alphanumeric characters and must start with an alphabetic character."  ,
      "FUNCTION_ABS_DESC_KEY": "This function returns the absolute value of arg."  ,
      "FUNCTION_COMPARE_DESC_KEY":
      "This function returns -1, 0, or 1, depending on whether the value of the comparand1 is respectively less than, equal to, or greater than the value of comparand2, according to the rules of the collation that is used."  ,
      "FUNCTION_CURRENTDATE_DESC_KEY": "This function returns the current xs:date."  ,
      "FUNCTION_CURRENTDATETIME_DESC_KEY": "This function returns the current xs:dateTime."  ,
      "FUNCTION_CURRENTGROUP_DESC_KEY": "This function returns the current group when used in conjunction with a for-each-group XSL element."  ,
      "FUNCTION_CURRENTGROUPINGKEY_DESC_KEY": "This function returns the current grouping key when used in conjunction with a for-each-group XSL element."  ,
      "FUNCTION_CURRENTTIME_DESC_KEY": "This function returns the current xs:time."  ,
      "FUNCTION_ENDSWITH_DESC_KEY":
      "This function returns an xs:boolean indicating whether or not the value of arg1 starts with a sequence of collation units that provides a match to the collation units of arg2 according to the collation that is used."  ,
      "FUNCTION_EXISTS_DESC_KEY": "Returns true if the argument is a non-empty sequence.",
      "FUNCTION_DATA_DESC_KEY": "Returns the result of atomizing a sequence. This process flattens arrays, and replaces nodes by their typed values.",
      "FUNCTION_LOWERCASE_DESC_KEY":
      "This function returns the value of arg after translating every character to its lower-case value." ,
      "FUNCTION_QNAME_DESC_KEY":
      "This function returns an xs:QName with the namespace URI given in paramURI. If paramURI is the zero-length string or the empty sequence, it represents \"no namespace\"; in this case, if the value of paramQName contains a colon (:), an error is raised. The prefix (or absence of a prefix) in paramQName is retained in the returned xs:QName value. The local name in the result is taken from the local part of paramQName."  ,
      "FUNCTION_RESOLVEQNAME_DESC_KEY":
      "This function returns an xs:QName value (that is, an expanded-QName) by taking an xs:string that has the lexical form of an xs:QName (a string in the form \"prefix:local-name\" or \"local-name\") and resolving it using the in-scope namespaces for a given element."  ,
      "FUNCTION_UPPERCASE_DESC_KEY":
      "This function returns the value of arg after translating every character to its upper-case value."  ,
      "FUNCTION_YEARSFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the years component in the value of arg. The result is obtained by casting arg to an xs:yearMonthDuration and then computing the years component."  ,
      "FUNCTION_MONTHSFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the months component in the value of arg. The result is obtained by casting arg to an xs:yearMonthDuration and then computing the months component."  ,
      "FUNCTION_DAYSFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the days component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component."  ,
      "FUNCTION_HOURSFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the hours component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component."  ,
      "FUNCTION_MINUTESFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the minutes component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component."  ,
      "FUNCTION_SECONDSFROMDURATION_DESC_KEY":
      "This function returns an xs:integer representing the seconds component in the value of arg. The result is obtained by casting arg to an xs:dayTimeDuration and then computing the days component."  ,
      "FUNCTION_YEARFROMDATETIME_DESC_KEY":
      "This function returns an xs:integer representing the year component in the localized value of arg. The result may be negative."  ,
      "FUNCTION_YEARMONTHDURATION_DESC_KEY" :
      "This function converts its argument to a yearMonthDuration.",
      "FUNCTION_MONTHFROMDATETIME_DESC_KEY":
      "This function returns an xs:integer between 1 and 12, both inclusive, representing the month component in the localized value of arg."  ,
      "FUNCTION_DAYFROMDATETIME_DESC_KEY":
      "This function returns an xs:integer between 1 and 31, both inclusive, representing the day component in the localized value of arg."  ,
      "FUNCTION_HOURSFROMDATETIME_DESC_KEY":
      "This function returns an xs:integer between 0 and 23, both inclusive, representing the hours component in the localized value of arg."  ,
      "FUNCTION_MINUTESFROMDATETIME_DESC_KEY":
      "This function returns an xs:integer value between 0 and 59, both inclusive, representing the minute component in the localized value of arg."  ,
      "FUNCTION_SECONDSFROMDATETIME_DESC_KEY":
      "This function returns an xs:decimal value greater than or equal to zero and less than 60, representing the seconds and fractional seconds in the localized value of arg."  ,
      "FUNCTION_TIMEZONEFROMDATETIME_DESC_KEY":
      "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence."  ,
      "FUNCTION_YEARFROMDATE_DESC_KEY":
      "This function returns an xs:integer representing the year in the localized value of arg. The value may be negative."  ,
      "FUNCTION_MONTHFROMDATE_DESC_KEY":
      "This function returns an xs:integer between 1 and 12, both inclusive, representing the month component in the localized value of arg."  ,
      "FUNCTION_DAYFROMDATE_DESC_KEY":
      "This function returns an xs:integer between 1 and 31, both inclusive, representing the day component in the localized value of arg."  ,
      "FUNCTION_TIMEZONEFROMDATE_DESC_KEY":
      "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence."  ,
      "FUNCTION_HOURSFROMTIME_DESC_KEY":
      "This function returns an xs:integer between 0 and 23, both inclusive, representing the value of the hours component in the localized value of arg."  ,
      "FUNCTION_MINUTESFROMTIME_DESC_KEY":
      "This function returns an xs:integer value between 0 and 59, both inclusive, representing the value of the minutes component in the localized value of arg."  ,
      "FUNCTION_SECONDSFROMTIME_DESC_KEY":
      "This function returns an xs:decimal value greater than or equal to zero and less than 60, representing the seconds and fractional seconds in the localized value of arg."  ,
      "FUNCTION_TIMEZONEFROMTIME_DESC_KEY":
      "This function returns the timezone component of arg if any. If arg has a timezone component, then the result is an xs:dayTimeDuration that indicates deviation from UTC; its value may range from +14:00 to -14:00 hours, both inclusive. Otherwise, the result is the empty sequence."  ,
      "FUNCTION_ADJUSTDATETIMETOTIMEZONE_DESC_KEY":
      "This function adjusts an xs:dateTime value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:dateTime without a timezone. Otherwise, returns an xs:dateTime with a timezone.  If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context."  ,
      "FUNCTION_ADJUSTDATETOTIMEZONE_DESC_KEY":
      "This function adjusts an xs:date value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:date without a timezone. Otherwise, returns an xs:date with a timezone. For purposes of timezone adjustment, an xs:date is treated as an xs:dateTime with time 00:00:00.  If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context."  ,
      "FUNCTION_ADJUSTTIMETOTIMEZOME_DESC_KEY":
      "This function adjusts an xs:time value to a specific timezone, or to no timezone at all. If timezone is the empty sequence, returns an xs:time without a timezone. Otherwise, returns an xs:time with a timezone. If timezone is not specified, then timezone is the value of the implicit timezone in the dynamic context."  ,
      "FUNCTION_IMPLICITTIMEZONE_DESC_KEY":
      "This function returns the value of the implicit timezone property from the dynamic context."  ,
      "FUNCTION_INTEGER_DESC_KEY": "This function converts its argument to an integer."  ,
      "FUNCTION_DATE_DESC_KEY": "This function converts its argument to a date."  ,
      "FUNCTION_DOUBLE_DESC_KEY": "This function converts its argument to a double."  ,
      "FUNCTION_DURATION_DESC_KEY": "This function converts its argument to a duration."  ,
      "FUNCTION_DAYTIMEDURATION_DESC_KEY": "This function converts its argument to a dayTimeDuration."  ,
      "FUNCTION_TIME_DESC_KEY": "This function converts its argument to a time."  ,
      "FUNCTION_DATETIME_DESC_KEY": "This function converts its argument to a datetime."  ,
      "FUNCTION_DECIMAL_DESC_STR": "This function converts its argument to a decimal."  ,
      "FUNCTION_NODESET_FROM_DELIMSTRING_DESC_KEY": "Returns a delimited string created from nodeSet delimited by delimiter. Usage: oraext:create-delimited-string(nodeSet as node-set, delimiter as string)"  ,
      "FUNCTION_GENERATE_GUID_DESC_KEY": "Returns a GUID of fixed 32 characters in length."  ,
      "FUNCTION_LOOKUP_XML_DESC_KEY": "This function returns the string value of an element defined by lookupXPath in an XML file (docURL) given its parent XPath (parentXPath), the key XPath (keyXPath), and the value of the key (key)"  ,
      "FUNCTION_PARSE_ESCA_XML_DESC_KEY": "This function parses an XML string to an XML element. The signature of this function is oraext:parseEscapedXML(xmlString as String)."  ,
      "FUNCTION_PARSE_XML_DESC_KEY": "This function parses a string to a DOM element. Usage: oraext:parseXML(xmlString as String)"  ,
      "FUNCTION_MAX_NODESET_DESC_KEY": "This function returns the maximum value from a list of input numbers, the node set inputNumber.The node set inputNumber can be a collection of text nodes or elements containing text nodes. In the case of elements, the first text node's value is considered. Usage: oraext:max-value-among-nodeset(inputNumber as node-set)"  ,
      "FUNCTION_MIN_NODESET_DESC_KEY": "This function returns the minimum value from a list of input numbers, the node set inputNumber.The node set inputNumber can be a collection of text nodes or elements containing text nodes. In the case of elements, the first text node's value is considered. Usage: oraext:min-value-among-nodeset(inputNumbers as node-set)"  ,
      "FUNCTION_SQUARE_ROOT_DESC_KEY": "This function returns the square root of inputNumber. Usage: oraext:square-root(inputNumber as number)"  ,
      "FUNCTION_COMPARE_IGNORE_CASE_DESC_KEY": "This function returns the lexicographical difference between inputString and compareString while ignoring case and comparing the unicode value of each character of both the strings. This function returns -1 if inputString lexicographically precedes the compareString. This function returns 0 if both inputString and compareString are equal. This function returns 1 if inputString lexicographically follows the compareString. Usage: oraext:compare-ignore-case(inputString as string, compareString as string)"  ,
      "FUNCTION_CREATE_DELIM_STRING_CASE_DESC_KEY": "This function returns a delimited string created from nodeSet delimited by a delimiter. Usage: oraext:create-delimited-string(nodeSet as Nodeset, delimiter as string)"  ,
      "FUNCTION_FORMAT_STRING_CASE_DESC_KEY": "This function returns the message formatted with the arguments passed. At least one argument is required and supports up to a maximum of 10 arguments. Usage: oraext:format-string(messageToFormat as string, arg1 as string, arg2 as string, arg3 as string, arg4 as string, arg5 as string, arg6 as string, arg7 as string, arg8 as string, arg9 as string)"  ,
      "FUNCTION_GET_CONTENT_STRING_DESC_KEY": "This function returns the XML representation of the input element. Usage: oraext:get-content-as-string(element as node-set)"  ,
      "FUNCTION_GET_LOCALIZED_STRING_DESC_KEY": "This function returns the locale-specific string for the key. This function uses language, country, variant, and resource bundle to identify the correct resource bundle. All parameters must be in string format. Use the string() function to convert any parameter values to strings before sending them to get-localized-string. Usage: oraext:get-localized-string(resourceBaseURL as string, resourceLocation as string, resourcebundle as string, language as string, country as string, variant as string, key as string)"  ,
      "FUNCTION_INDEX_WITHIN_STRING_DESC_KEY": "This function returns the zero-based index of the first occurrence of searchString within the inputString. This function returns -1 if searchString is not found. Usage: oraext:index-within-string(inputString as string, searchString as string)"  ,
      "FUNCTION_LAST_INDEX_WITHIN_STRING_DESC_KEY": "This function returns the zero-based index of the last occurrence of searchString within the inputString. This function returns -1 if searchString is not found."  ,  "FUNCTION_LAST_INDEX_WITHIN_STRING_DESC_KEY": "This function returns the zero-based index of the last occurrence of searchString within the inputString. This function returns -1 if searchString is not found. Usage: oraext:last-index-within-string(inputString as string, searchString as string)"  ,
      "FUNCTION_LEFT_TRIM_DESC_KEY": "This function returns the value of inputString after removing all the leading white spaces. Usage: oraext:left-trim(input-string as string)"  ,
      "FUNCTION_RIGHT_TRIM_DESC_KEY": "This function returns the value inputString after removing all the trailing white spaces. Usage: oraext:right-trim(inputString as string)"  ,
      "FUNCTION_DECODE_DESC_KEY": "The method decodes the inputString which is encoded previously using Base64 encoding scheme and returns the decoded value"  ,
      "FUNCTION_ENCODE_DESC_KEY": "The method encodes the inputString using Base64 encoding scheme and returns the encoded value"  ,
      "FUNCTION_DOCUMENT_DESC_KEY": "This function allows access to XML documents other than the main source document." ,
      "FUNCTION_ELEMENT_AVAILABLE_DESC_KEY": "This function checks if the expanded-name is the name of an instruction" , 
      "FUNCTION_FORMAT_NUMBER_DESC_KEY": "This function converts its first argument to a string using the format pattern string specified by the second argument and the decimal-format named by the third argument, or the default decimal-format, if there is no third argument" , 
      "FUNCTION_FUNCTION_AVAILABLE_DESC_KEY": "This function checks if the expanded-name is the name of a function in the function library" , 
      "FUNCTION_KEY_DESC_KEY": "This functions selects elements by their keys" , 
      "FUNCTION_SYSTEM_PROPERTY_DESC_KEY": "This function returns an object representing the value of the system property identified by the name" , 
      "FUNCTION_UNPARSED_ENTITY_URI_DESC_KEY": "This function returns the URI of the unparsed entity with the specified name in the same document as the context node. It returns the empty string if there is no such entity." ,
      "FUNCTION_DISTINCT_VALUES_DESC_KEY": "This function returns the values that appear in a sequence, with duplicates eliminated." ,
      "FUNCTION_LOOKUP_VALUE_DESC_KEY" : "This function returns a string by looking up the value for the target column in a domain value map, where the source column contains the given source value.",
      "FUNCTION_GET_FLOW_ID_KEY" : "This function returns ICS Flow-Id",
      "FUNCTION_IS_REPLAYED_DESC_KEY" : "This function returns true if the executing instance was triggered through a replay.",
      "FUNCTION_GET_FAULT_STRING_KEY" : "This function returns the fault as a string value.",
      "FUNCTION_GET_FAULT_XML_KEY" : "This function returns the fault as an XML element.",
      "FUNCTION_GET_FAULT_ACTION_KEY" : "This function returns the fault of the action",
      "FUNCTION_GET_FAULT_NAME_KEY" : "This function returns the fault name."
  });