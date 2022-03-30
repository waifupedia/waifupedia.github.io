const params = new Proxy(new URLSearchParams(window.location.search), {
	get: (searchParams, prop) => searchParams.get(prop),
});
// console.log(params.z);

if (params.a !== null){
	// console.log('address detected');
	document.getElementById('slpAddress').value = params.a;
	// window.history.pushState({}, document.title, "/" + "");
}

// const queryString = window.location.search;
// console.log(queryString);

function generateQueryURI(slp_add, querySkip, queryLimit) {
	// const slpDataBaseServer = 'https://slpdb.electroncash.de/q/';
	// const slpDataBaseServer = 'https://slpdb.fountainhead.cash/q/';
	const slpDataBaseServer = 'https://slpdb.bitcoin.com/q/';

	const sortMethod = document.getElementById('sort-method').value;
	// console.log(sortMethod);

	let sortMethodKey = '';
	let sortMethodAtoZ = 0;
	if (sortMethod === 'sort-by-token-id-ascend'){
		sortMethodKey = '_id';
		sortMethodAtoZ = 1;
	}
	else if (sortMethod === 'sort-by-token-id-descend'){
		sortMethodKey = '_id';
		sortMethodAtoZ = -1;
	}
	else if (sortMethod === 'sort-by-name-ascend'){
		sortMethodKey = 'token.tokenDetails.name';
		sortMethodAtoZ = 1;
	}
	else if (sortMethod === 'sort-by-name-descend'){
		sortMethodKey = 'token.tokenDetails.name';
		sortMethodAtoZ = -1;
	}

	let plainstr = 
`
{
	"v": 3,
	"q": {
		"db": ["g"],
		"aggregate": [
			{ "$match": { 
				"tokenDetails.nftGroupIdHex" : "a2987562a405648a6c5622ed6c205fca6169faa8afeb96a994b48010bd186a66",
				"graphTxn.outputs.address": "${slp_add}",
				"graphTxn.outputs.status": "UNSPENT"
				}
			},
			{ "$group": {
				"_id": "$tokenDetails.tokenIdHex",
				"slpAmount": { "$sum": "$graphTxn.outputs.slpAmount" }
				}
			},
			{ "$lookup": {
				"from": "tokens",
				"localField": "_id",
				"foreignField": "tokenDetails.tokenIdHex",
				"as": "token"
				}
			}
		],
		"sort": { "${sortMethodKey}": ${sortMethodAtoZ} },
		"skip": ${querySkip},
		"limit": ${queryLimit}
	}
}
`;

	// console.log(plainstr);

	// let plainstr = `{"v":3,"q":{"db":["g"],"aggregate":[{"$match":{"graphTxn.outputs.address":"${slp_add}"}},{"$unwind":"$graphTxn.outputs"},{"$match":{"graphTxn.outputs.status":"UNSPENT","graphTxn.outputs.address":"${slp_add}"}},{"$group":{"_id":"$tokenDetails.tokenIdHex","slpAmount":{"$sum":"$graphTxn.outputs.slpAmount"}}},{"$sort":{"slpAmount":-1}},{"$match":{"slpAmount":{"$gt":0}}},{"$lookup":{"from":"tokens","localField":"_id","foreignField":"tokenDetails.tokenIdHex","as":"token"}}],"sort":{"_id":1},"skip":0,"limit":300}}`;
	// console.log(plainstr);

	const queryURI = slpDataBaseServer + btoa(plainstr);
	// console.log(queryURI);
	
	return queryURI;
}

async function fetchJSON(api_uri) {
	let response = await fetch(api_uri);
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	
	let myJSON = await response.json();
	
	return await myJSON;
}


const queryLimit = 100;
let isRunning = false;
let showingPage = 1;
let waifuOwnedIndex = 0;

async function showWaifus(querySkip) {

    if (isRunning == false) {
        isRunning = true;

		// waifuOwnedIndex = querySkip;
		// console.log(waifuOwnedIndex == 0);
		if (querySkip === 0) {
			showingPage = 1;
			waifuOwnedIndex = querySkip;
		} else if (querySkip !== 0) {
			if (querySkip === waifuOwnedIndex) {
				showingPage++;
			} else if (querySkip < waifuOwnedIndex) {
				showingPage--;
				querySkip = queryLimit * (showingPage-1);
				waifuOwnedIndex = querySkip;
			}
		}
		// console.log(querySkip + ", " + showingPage + ": " + waifuOwnedIndex);

		document.getElementById('number-of-waifus').innerHTML = '';
		document.getElementById('waifusdiv').innerHTML = "Loading...";

		const waifufaucet = 'https://icons.waifufaucet.com/original/';
		const simpleledger = 'http://simpleledger.info/#token/';
		const wgrp_id = 'a2987562a405648a6c5622ed6c205fca6169faa8afeb96a994b48010bd186a66';
		const kanji_uri = './waifu_kanji.json';
		const img_width = '240px';

		const slp_add = document.getElementById('slpAddress').value;

		const queryURI = generateQueryURI(slp_add, querySkip, queryLimit);
		const waifus = await fetchJSON(queryURI);
		// console.log(waifus);
		const kanji = await fetchJSON(kanji_uri);
		// console.log(kanji);

		document.getElementById('waifusdiv').innerHTML = '';
		for (let i = 0; i < waifus.g.length; i++) {
			if (waifus.g[i].token[0].nftParentId === wgrp_id) {
				waifuOwnedIndex++;
				let tokenId = waifus.g[i]._id;

				if (typeof kanji[tokenId] !== 'undefined') {
					document.getElementById('waifusdiv').innerHTML += `<span class="nftdisplay"><h3>#${waifuOwnedIndex} ${waifus.g[i].token[0].tokenDetails.name}</h3><a href="${simpleledger}${waifus.g[i]._id}" title="Check on SLP Explorer" target="_blank"><img src="${waifufaucet}${waifus.g[i]._id}.png" width="${img_width}"/></a>
					<h2 class="waifu-name-kj">${kanji[tokenId]["kjlastname"]} ${kanji[tokenId]["kjfirstname"]}</h2></span>`;
				} else {
					document.getElementById('waifusdiv').innerHTML += `<span class="nftdisplay"><h3>#${waifuOwnedIndex} ${waifus.g[i].token[0].tokenDetails.name}</h3><a href="${simpleledger}${waifus.g[i]._id}" title="Check on SLP Explorer" target="_blank"><img src="${waifufaucet}${waifus.g[i]._id}.png" width="${img_width}"/></a>
					<h2>&nbsp;</h2></span>`;
				}

			}
		}

		if (waifuOwnedIndex < queryLimit){
			document.getElementById('number-of-waifus').innerHTML = `<h3>... ${waifuOwnedIndex} Waifus in total.</h3>`;
		} else if (waifuOwnedIndex >= queryLimit && waifuOwnedIndex < queryLimit * 2) {
			document.getElementById('number-of-waifus').innerHTML = `<h3>... showing the first ${waifuOwnedIndex} Waifus ... <button class="onShow" onclick="showWaifus(${queryLimit*showingPage})">Show More</button></h3>`;
			// showingPage++;
		} else if (waifuOwnedIndex >= queryLimit * showingPage) {
			document.getElementById('number-of-waifus').innerHTML = `<h3><button class="onShow" onclick="showWaifus(${queryLimit*(showingPage-1)})">Show Previous</button> ... showing&nbsp;&nbsp;Waifus&nbsp;&nbsp;#${waifuOwnedIndex-queryLimit+1}&nbsp;&nbsp;~&nbsp;&nbsp;#${waifuOwnedIndex} ... <button class="onShow" onclick="showWaifus(${queryLimit*showingPage})">Show More</button></h3>`;
			// showingPage++;
		} else {
			document.getElementById('number-of-waifus').innerHTML = `<h3><button class="onShow" onclick="showWaifus(${queryLimit*(showingPage-1)})">Show Previous</button> ... ${waifuOwnedIndex} Waifus in total.</h3>`;
		}

		isRunning = false;
	}


	// fetchJSON(generateQueryURI(slp_add))
	// .then( waifus => {
	// 	fetchJSON(kanji_uri)
	// 	.then( kanji => {
	// 		let waifusDisplay = `<table width="${table_width}" alignment="center">\n`;
	// 		let i_col = 0;
	// 		let i_shown = 0;
	// 		for (var i = 0; i < waifus.g.length; i++) {
	// 			if (waifus.g[i].token[0].nftParentId === wgrp_id) {

	// 				if (i_col == 0) {
	// 					waifusDisplay = waifusDisplay + `<tr>\n`;
	// 				}

	// 				let tokenId = waifus.g[i]._id;
	// 				waifusDisplay = waifusDisplay + `<td align="center" width="$td_width">
	// 				<h3>&nbsp;${waifus.g[i].token[0].tokenDetails.name}</h3>
	// 				<p><a href="${simpleledger}${waifus.g[i]._id}" title="Check on SLP Explorer" target="_blank"><img src="${waifufaucet}${waifus.g[i]._id}.png" width="${img_width}"/></a></p>
	// 				<h2>${kanji[tokenId]["kjlastname"]} ${kanji[tokenId]["kjfirstname"]}</h2>
	// 				</td>`;

	// 				i_col++;

	// 				if (i_col == n_col){
	// 					i_col = 0;
	// 					waifusDisplay = waifusDisplay + `</tr>\n`;
	// 				}
	// 			}	
	// 		}
	// 		document.getElementById('waifusdiv').innerHTML = waifusDisplay;
	// 	})
	// })

}
