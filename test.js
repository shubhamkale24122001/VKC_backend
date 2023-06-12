arr=["manga","place","holder"];
console.log(arr.find((item)=>item==="ball"));
if(!arr.find((item)=>item==="ball")){
    console.log("ball not found");
}
else{
    console.log("ball found");
}