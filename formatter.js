//QUERY SELECTORS
const formattableQuerySelectors = {
    webClient: {
        tweets: ".tweet-text",
        directMessages: ".DMInboxItem-snippet",
        bio: ".ProfileHeaderCard-bio",
    },
    mobileWebClient: {
        tweets: "#react-root [data-testid=tweet] > div > div > div:first-of-type + div",
        expandedTweets: "#react-root [data-testid=tweetDetail] > div ~ div ~ div:not([data-testid=UserCell])",
        directMessages: "#react-root [data-testid=messageEntry] > div > div > div > div",
        // directMessageConversationListItems: "#react-root [data-testid=conversation] > div:first-of-type > div:first-of-type + div > div:first-of-type > div:first-of-type + div > div > span",
        bioOnProfilePage: "[data-testid=primaryColumn] [dir=auto] + div > [dir=auto] :not(a)",
        bioInSidebar: "[data-testid=sidebarColumn] [data-testid=UserCell] > div > div > div ~ div"
    }
}
const formattableQuerySelectorString =
    Object.keys(formattableQuerySelectors).map(clientName => {
        const client = formattableQuerySelectors[clientName]
        return Object.keys(client).map(selector => client[selector])
    }).join(", ")


const astInCodeExp = /([^`]*`[^`]*)\*([^`]*`[^`]*)/g //To escape asterisks in code tags
const underscInCodeExp = /([^`]*`[^`]*)_([^`]*`[^`]*)/g //To escape underscores in code tags

let doingChanges = false

const createCodeElement = (content, isBlock) => `<span class='tweetdwn-code-wrapper ${isBlock ? "block" : ""}'><span class='tweetdwn-placeholder'>// Code</span><code>${content}</code></span>`


//RECURSIVE DOM PARSING
const formatLeafElement = element => {
    let html = element.innerHTML

    //Escaping special characters in code tags
    while(astInCodeExp.test(html)) html = html.replace(astInCodeExp, "$1~~~esc~ast~~~$2")
    while(underscInCodeExp.test(html)) html = html.replace(underscInCodeExp, "$1~~~esc~und~~~$2")
    //I know that bit was copied but eh
    //Escaping escaped thingies
    html = html.replace(/\\`/g, "~~~esc~this~thing~~~")

    //CODE
    //Code blocks
    html = html.replace(/```\s*([^`]+)\s*```/g, createCodeElement("$1", true))
    //Inline code
    html = html.replace(/`([^`\n]+)`/g, createCodeElement("$1", false))
    //Implicit code blocks
    html = html.replace(/`\s*([^`]+)\s*`/g, createCodeElement("$1", true))
    //BOLD
    html = html.replace(/((?:\*\*)|(?:__))(.+?)\1/g, "<strong>$2</strong>")
    //ITALIC
    html = html.replace(/(\*|_)(.+?)\1/g, "<i>$2</i>")

    //Substitute the escape-placeholders
    html = html.replace(/~~~esc~ast~~~/g, "*")
    html = html.replace(/~~~esc~und~~~/g, "_")
    html = html.replace(/~~~esc~this~thing~~~/g, "`")

    element.innerHTML = html
}

const formatBranchElement = element => {
    for(let j = 0; j < element.children.length; j++) {
        formatElement(element.children[j])
    }
}

const formatElement = element => {
    if(element.children.length > 0) formatBranchElement(element)
    else formatLeafElement(element)
}


const format = () => {
    if(doingChanges) return
    doingChanges = true
    console.log("Formatting Markdown on Twitter...")

    const elements = document.querySelectorAll(formattableQuerySelectorString)
    for(var i = 0; i < elements.length; i++) {
        const element = elements[i]
        if(element.hasAttribute("tweetdown-formatted")) continue

        formatElement(element)
        
        element.setAttribute("tweetdown-formatted", "true")
    }
    setTimeout(() => doingChanges = false, 200)
}

const observer = new MutationObserver(() => format())
setTimeout(() => {
    observer.observe(document, {subtree: true, childList: true, attributes: false})
    format()
}, window.location.host === "mobile.twitter.com" ? 1500 : 500)
