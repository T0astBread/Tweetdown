//#region QUERY SELECTORS
const buildQuerySelectorString = selectors =>
Object.keys(selectors).map(clientName => {
    const client = selectors[clientName]
    return Object.keys(client).map(selector => client[selector])
}).join(", ")

const formattableQuerySelectors = {
    webClient: {
        tweets: ".tweet-text",
        directMessages: ".DMInboxItem-snippet",
        bio: ".ProfileHeaderCard-bio",
    },
    mobileWebClient: {
        tweets: "#react-root [data-testid=tweet]",
        expandedTweets: "#react-root [data-testid=tweetDetail]",
        directMessages: "#react-root [data-testid=messageEntry]",
        // directMessageConversationListItems: "#react-root [data-testid=conversation] > div:first-of-type > div:first-of-type + div > div:first-of-type > div:first-of-type + div > div > span",
        bioOnProfilePage: "[data-testid=primaryColumn] [dir=auto] + div > [dir=auto]",
        bioInSidebar: "[data-testid=sidebarColumn] [data-testid=UserCell] [dir=auto]"
    }
}
const formattableQuerySelectorString = buildQuerySelectorString(formattableQuerySelectors)

const excludedQuerySelectors = {
    webClient: {
        link: "a"
    },
    mobileWebClient: {
        userCell: "[data-testid=UserCell]",
        link: "a[role=link]"
    }
}
const excludedQuerySelectorsString = buildQuerySelectorString(excludedQuerySelectors)
//#endregion


const astInCodeExp = /([^`]*`[^`]*)\*([^`]*`[^`]*)/g //To escape asterisks in code tags
const underscInCodeExp = /([^`]*`[^`]*)_([^`]*`[^`]*)/g //To escape underscores in code tags

let doingChanges = false

const createCodeElement = (content, isBlock) => `<span class='tweetdwn-code-wrapper ${isBlock ? "tweetdwn-code-block" : "tweetdwn-inline-code"}'><span class='tweetdwn-placeholder'>// Code</span><code>${content}</code></span>`


//#region RECURSIVE DOM PARSING
const formatLeafElement = element => {
    let html = element.innerHTML

    //Resolve escaped dots (to prevent Twitter from turning everything with a dot into a link)
    html = html.replace(/\\\./g, "<span class='tweetdwn-escaped' title='Escaped dot'>.</span>")

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
    html = html.replace(/((?:\*\*)|(?:__))(.+?)\1/g, "<strong class='tweetdwn-bold'>$2</strong>")
    //ITALIC
    html = html.replace(/(\*|_)(.+?)\1/g, "<i class='tweetdwn-italic'>$2</i>")

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
    if(element.matches(excludedQuerySelectorsString)) {
        console.log(`Excluded: ${element.innerHTML}`)
        return
    }
    if(element.children.length > 0) formatBranchElement(element)
    else formatLeafElement(element)
}
//#endregion


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
