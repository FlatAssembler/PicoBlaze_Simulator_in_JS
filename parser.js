"use strict";
function parse(tokenized) {
    let report="[";
    for (let i=0; i<tokenized.length; i++)
       if (i<tokenized.length-1)
         report+=tokenized[i].getLispExpression()+",";
       else
         report+=tokenized[i].getLispExpression();
    report+=']';
    console.log("Parsing the expression: "+report);
    let root=new TreeNode("assembly",0); //Value which will be returned.
    for (let i=0; i<tokenized.length; i++) //First, let's deal with the parentheses.
    {
        if (tokenized[i].text=='(') { //As far as I know, PicoBlaze Assembly uses only this type of parentheses.
            let counter=1;
            let j=i+1;
            while (counter) {
                if (j>=tokenized.length) {
                    alert("The parenthesis on line "+tokenized[i].lineNumber+" isn't closed!");
                    return root;
                }
                if (tokenized[j].text=='(') counter++;
                if (tokenized[j].text==')') counter--;
                j++;
            }
            let newArray=[];
            for (let k=i+1; k<j-1; k++)
                newArray.push(tokenized[k]);
            tokenized.splice(i+1,j-i-1);
            tokenized[i].text="()";
            tokenized[i].children=parse(newArray).children;
        }
    }
    root.children=tokenized;
    return root;
}
