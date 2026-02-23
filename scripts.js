function parseExpression(expr) {
    if (!expr) return
    //tokenise raw expression - includes sense checks for valid expressions
    const tokens = tokenise(expr)
    //if failure at this point return the tokens
    //this will include an error message but no tokens
    if (!tokens.success) return tokens

    //if valid tokens have been produced then they can be converted into postfix
    const postFix = toPostFix(tokens.tokens)

    console.log(postFix)

}

function toPostFix(tokens) {
    //postfix will be returned at the end
    //will contain tokens in post fix order
    const postfix = []
    //op stack is a helper to push / pop op and paratheses to and from to form post fix
    const opStack = []

    //required to check whether to push / pop from opStack
    //should only push if precendence is higher
    const precedence = ["OR", "AND", "NOT"]
    //go through tokens in order
    for (t of tokens) {
        //switch on the type of each token i.e. VAR, CLOSEPAR etc.
        switch (t.type) {
            //Both VAR and CONSTS get pushed straight to postfix
            case "VAR":
            case "CONST":
                postfix.push(t)
                continue
            //( gets pushed to the opStack - used as a bookmark to unwind to when its matching ) is found
            case "OPENPAR":
                opStack.push(t)
                continue
            //if a ) is found then we pop from the opStack until the matching ) is found
            case "CLOSEPAR":
                while (opStack.length && peek(opStack).type !== "OPENPAR") {
                    postfix.push(opStack.pop())
                }
                //sense checking 
                //-- if we have unwound the opstack all the way and no matching ( is found then return an error
                if (!opStack.length) {
                    return { success: false, message: "Mismatched parentheses" }
                }
                //at this point we need to remove the (
                opStack.pop()
                continue
            //Pair up AND / OR as they are left associative unlike NOT
            case "AND":
            case "OR":
                //pop from the op stack whilst:
                while (opStack.length //there are actually things in it
                    && ["AND", "OR", "NOT"].includes(peek(opStack)) //the item at the top is an operator and not a (
                    && precedence.indexOf(peek(opStack).type) >= precedence.indexOf(t.type)) { //the top item's precendence is greater or equal to the current token
                    //keep popping!
                    postfix.push(opStack.pop())
                }
                //once you've cleared off all the equal or higher precedence from the op stack, push the current token to it
                opStack.push(t)
                continue
            case "NOT":
                //NOT always has highest so checks aren't needed - don't need to pop on same precedence as not is right associative
                //this allows expressions like ¬¬A
                opStack.push(t)
                continue
            default:
                //If we've got this far we can assume something invalid has snuck through!
                return { success: false, message: `unexpected token ${t.type}` }
        }
    }

    //One every token has been checked then we unwind the remaining items on the opStack onto the postfix
    while (opStack.length) {
        const op = opStack.pop()
        //Little check here - if we're left with an ( at this point then it must be missing its ) 
        if (op.type === "OPENPAR") {
            return { success: false, message: "mismatched parantheses" }
        }
        postfix.push(op)

    }

    //Phew - finally return the post fix and done!
    return { success: true, postfix }

}

//useful helper to look at the top item on the opStack
function peek(stack) {
    return stack[stack.length - 1]
}

//will return a tokenised version of the raw expression
function tokenise(expr) {
    //initial blank array to be filled with tokens - will be return at the end
    const tokens = []
    //just tidy up the expression to remove all spaces and force to upper case
    const cleanExpr = expr.replaceAll(" ", "").toUpperCase()

    //go through each character in the now cleaned up expression
    for (let char of cleanExpr) {
        //Uses a set of helpers to determine if each char is a:
        // variable i.e. A,B,C etc, 
        // constant i.e. 1 or 0
        // or a symbol + . ! ¬ ( )
        if (isVariable(char)) {
            tokens.push({ type: "VAR", value: char })
        } else if (isSymbol(char)) {
            tokens.push({ type: getOperatorType(char) })
        } else if (isConstant(char)) {
            tokens.push({ type: "CONST", value: char })
        } else {
            //if any don't meet these requirements then we fail here
            return { success: false, message: `Invalid character found: ${char}` };
        }
    }

    //Finish with some sense checking of the tokens
    //Can't be started with CLOSEPAR, AND or OR
    if (["CLOSEPAR", "AND", "OR"].includes(tokens[0].type)) {
        return { success: false, message: `Expressions cannot start with: ${tokens[0].type}` };
    }

    //Can't end in OPENPAR, AND or OR or NOT
    if (["OPENPAR", "AND", "OR", "NOT"].includes(tokens[tokens.length - 1].type)) {
        return { success: false, message: `Expressions cannot end with: ${tokens[tokens.length - 1].type}` }
    }

    //Can't have two AND / ORs in a row
    for (let i = 0; i < tokens.length - 2; i++) {
        if (["AND", "OR"].includes(tokens[i].type) && ["AND", "OR"].includes(tokens[i + 1].type)) {
            return { success: false, message: `${tokens[i].type} cannot be next to ${tokens[i].type}` }
        }
    }

    //Number of (  ) must match
    let openParCount = 0
    let closeParCount = 0
    for (let t of tokens) {
        if (t.type === "OPENPAR") {
            openParCount++
        }

        if (t.type === "CLOSEPAR") {
            closeParCount++
        }
    }

    if (openParCount !== closeParCount) {
        return { success: false, message: `Mismatched brackets` }
    }

    //if it passes all of this then we can assume it is a valid expression and we can return the tokens - hurray!
    return { success: true, tokens }
}


function getOperatorType(operator) {
    const operators = {
        "¬": "NOT",
        "!": "NOT",
        "+": "OR",
        ".": "AND",
        "(": "OPENPAR",
        ")": "CLOSEPAR"
    }

    return operators[operator]
}

function isSymbol(char) {
    //is the character one of the allowed symbols
    return /^[+.¬!()]$/.test(char)
}

function isVariable(char) {
    //determines if the character is in A-Z range
    return /^[A-Z]$/.test(char)
}

function isConstant(char) {
    //is the character either a 0 or a 1
    return /^[01]$/.test(char)
}

const exprInput = document.getElementById("expressionInput");

exprInput.oninput = () => {
    parseExpression(exprInput.value)
}