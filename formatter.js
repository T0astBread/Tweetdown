const astInCodeExp = /([^`]*`[^`]*)\*([^`]*`[^`]*)/g //To escape asterisks in code tags
const underscInCodeExp = /([^`]*`[^`]*)_([^`]*`[^`]*)/g //To escape underscores in code tags

let doingChanges = false

const createCodeElement = (content, isBlock) => `<span class='tweetdn-code-wrapper ${isBlock ? "block" : ""}'><span class='tweetdn-placeholder'>// Code</span><code>${content}</code></span>`

const format = () => {
    if(doingChanges) return
    doingChanges = true
    console.log("Formatting Markdown on Twitter...")

    const elements = document.querySelectorAll(".tweet-text, .ProfileHeaderCard-bio, .DMInboxItem-snippet")
    for(var i = 0; i < elements.length; i++) {
        const element = elements[i]
        if(element.hasAttribute("tweetdown-formatted")) continue

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
        element.setAttribute("tweetdown-formatted", "true")
    }
    setTimeout(() => doingChanges = false, 200)
}

const observer = new MutationObserver(() => format())
setTimeout(() => {
    observer.observe(document, {subtree: true, childList: true, attributes: false})
    format()
}, 500)
