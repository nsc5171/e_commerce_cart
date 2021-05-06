/*
approaches
1-> start from left : iterate and check for each -> multiple passes
2-> from right.. always maintain greatest till then if it is > curr elem then not a leader.. else leader

[16, 17, 4, 3, 5, 2]
[2]
[16, 17, 4, 3, 5, 2,0]
[16, 17, 4, 3, 5, 2,-5]
[]

?? range of numbers : can it be -Infinity
?? can numbers repeat? if repeated should it be considered again?


*/
function findLeaders(inpArr) {
    let leaders = [], maxTillNow = -Infinity, ind = inpArr.length - 1;

    while (ind >= 0) {
        let curr = inpArr[ind];
        if (curr > maxTillNow || (maxTillNow === -Infinity && curr === -Infinity)) {
            leaders.unshift(curr);
        }
        maxTillNow = Math.max(maxTillNow, curr);
        ind--;
    }
    return leaders;
}

console.log(findLeaders([16, 17, 4, 3, 5, 2])); // 17 5 2
console.log(findLeaders([2])); // 2
console.log(findLeaders([16, 17, 4, 3, 5, 2, 0])); // 17 5 2 0
console.log(findLeaders([16, 17, 4, 3, 5, 2, -5])); // 17 5 2 -5
console.log(findLeaders([])); //
console.log(findLeaders([16, 17, 4, -1, 3, 5, 2]));// 17 5 2
console.log(findLeaders([16, 17, 4, -1, 3, 5, -Infinity]));// 17 5 -Infinity
console.log(findLeaders([16, 17, 4, -1, 3, -Infinity, 5]));// 17 5
console.log(findLeaders([16, 17, 4, -1, 3, Infinity, 5]));// Infinity 5