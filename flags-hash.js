// CyberEdu CTF answer integrity hashes (SHA-256)
// Plaintext answers are intentionally NOT shipped — verification compares
// SHA-256(normalized(input)) against these digests.
// Normalization shared by client (script.js), server (server.js) and tests:
//   lowercase, all whitespace removed.
// Regenerate after changing an answer:  node scripts/gen-flag-hashes.js
const FLAG_HASHES = {
  "ctf-001": "7df7fb0c5737f9149adf654971f53d8941bddb2d0499ecc0e4a790e5a6fe72e5",
  "ctf-002": "0aa978845c0f56087b6bf4c9ed0a74d3fca18e9f248587b86dd9e3d1029a2a26",
  "ctf-003": "f6323121be1caf6123e4c1909293a99982dbdc51d4177b5a70ef7eab9138524d",
  "ctf-004": "ebf28d4de2937db0ce8d9eb21cbca3106f1892c635f9dafc619e98dd3b390580",
  "ctf-005": "f1133cc033eca8a8f5b568077a49c0a6845dcf5a0ab15199d363db96b42a3c9a",
  "ctf-006": "5de6a01f3d23fd01d04f97a31cf221550766d49d0eab6336dfcb15a742f845e8",
  "ctf-007": "668c0361bd73759980f8f9b030ca9f61f592e676eb1a59c72ffa713400563e36",
  "ctf-008": "3cfb34dfd3fcb4157e281c87c6475520e4d4dfe630ad9bc4d7c7066e5270ff07",
  "ctf-009": "3e559ba5e769bf5d7a0586a8dce2244e4ccbcc2fb4b95c1561233c08c9056507",
  "ctf-010": "d6d130d0d6c0b833baedba1a21e6b5133ba826afaf9954c707f0d6c02e394dfe",
  "ctf-011": "f7797ff2b033f3d510d6866ef6e0fc202fc87fbd160393bd4f794d42d9d5be10",
  "ctf-012": "f04f2167110a7eadd38c74d2531090d2c05a5c63f576470024d5209375faf0da",
  "ctf-013": "c6979294e69f21838accbe05d8f12c411c41f9af2f6690f0d170fdc0798809d8",
  "ctf-014": "db99f2ba793c0294dd1ed923a8476f7e12e1d135c9604ef0e29b6094a30aecf5",
  "ctf-015": "51b3f19ac90851a0ef78d244b875fea7fe6275c0c9be3f2428e77d045dd4f20a",
  "ctf-016": "7d93b68ef1bb0fdbc195283cc31f849a73754617fa3e1ab3d8ed00f5f6fbe764",
  "ctf-017": "d2c7f7d27339d58a44a050dc2db2b1092133a121557ac801dc61a6086b026189",
  "ctf-018": "28018e5c1b6b37767fa7fdf156c2f10c0b831cae7eed19de64d70e41169a503e",
  "ctf-019": "d6ee4f0b918ca03c62c0051dea5dc48e705d376d740adc1f98f499534deb0299",
  "ctf-020": "3e7b122af47827a50f3eafb3c690d3e8752e700b371208c48a8c966de35c162f",
  "ctf-021": "cc5c501434f1cfe348dbed4ec00049da3fcab1119dd9a99268cc1d35267018eb",
  "ctf-022": "ee61e6c1d1604a8090a9dc5832cfbe31e10a56340f8533eba6df8950acfd878a",
  "ctf-023": "db85e2f8acb3e042846696cef7706d3909dc923e6e1d67b363d9c14b57d17fbf",
  "ctf-024": "15ae131ffaf12c99dadb3f588a591be499e858abd3290a85791bd5872bd358e8",
  "ctf-025": "d3da9a59c94f124af33c8fce9e86cb722789c717c94f1afe36c9b7cdf08cca4a",
  "ctf-026": "ff0731139b7fef5454edad0a0aa3aece96f32e4862b7f6c215ca83ac00482e5c",
  "ctf-027": "7b9b1cf3a58f36406f1c6f4f295ba407da07e9e5575a55c71f4f1de4ee0eb32b",
  "ctf-028": "3c08fa48b9886540dedc02e4ad8da0d2f55a496c22da190b27f556c5cc6fc009",
};

function normalizeFlagInput(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

if (typeof module !== 'undefined') { // allow require() in Node (server/tests)
  module.exports = { FLAG_HASHES, normalizeFlagInput };
}
