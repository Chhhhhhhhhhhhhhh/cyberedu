// CyberEdu CTF answer integrity hashes (SHA-256)
// Plaintext answers are intentionally NOT shipped — verification compares
// SHA-256(normalized(input)) against these digests.
// Normalization shared by client (script.js), server (server.js) and tests:
//   lowercase, all whitespace removed.
// Regenerate after changing an answer:  node scripts/gen-flag-hashes.js
const FLAG_HASHES = {
  "ctf-001": "23a082447a457ad8853b8b7ff8452ec5e2cf9e4cd9267a07bcdd01c9effb7ef6",
  "ctf-002": "5aaf799915dfd73f6456c4fafca61489aafb54fd9f0631356f65a301e2f75c5f",
  "ctf-003": "f6323121be1caf6123e4c1909293a99982dbdc51d4177b5a70ef7eab9138524d",
  "ctf-004": "ebf28d4de2937db0ce8d9eb21cbca3106f1892c635f9dafc619e98dd3b390580",
  "ctf-005": "d6d130d0d6c0b833baedba1a21e6b5133ba826afaf9954c707f0d6c02e394dfe",
  "ctf-006": "c6979294e69f21838accbe05d8f12c411c41f9af2f6690f0d170fdc0798809d8",
  "ctf-007": "511701112ffc2db42908fe91826e28c0471b4a672231509421abec0d97939e76",
  "ctf-008": "3cfb34dfd3fcb4157e281c87c6475520e4d4dfe630ad9bc4d7c7066e5270ff07",
  "ctf-009": "c37d60cd0cb700db220431eff343a45f503046ed778718c4a15b3f2d52bd63e0",
  "ctf-010": "db99f2ba793c0294dd1ed923a8476f7e12e1d135c9604ef0e29b6094a30aecf5",
  "ctf-011": "189dc3723a0bcc54a2301f60ef87880fd732ee951bfb5cfbe5fef850b7d19e89",
  "ctf-012": "f04f2167110a7eadd38c74d2531090d2c05a5c63f576470024d5209375faf0da",
  "ctf-013": "f7797ff2b033f3d510d6866ef6e0fc202fc87fbd160393bd4f794d42d9d5be10",
  "ctf-014": "3a735d11c5e8b72ca28f14f9f84b5454f4dad653fd43e1152b61cd6b5bd6336a",
  "ctf-015": "15ae131ffaf12c99dadb3f588a591be499e858abd3290a85791bd5872bd358e8",
  "ctf-016": "7d93b68ef1bb0fdbc195283cc31f849a73754617fa3e1ab3d8ed00f5f6fbe764",
  "ctf-017": "a7ec9c69618b7949ed3903153e42cd8263ff2f1523dd58f571b3e8915f525976",
  "ctf-018": "daf72ebe8689787e62f76b583e1bc30b415a0680c9c69d7f0997769b1c95cd14",
  "ctf-019": "95f981e5ccf1674339ea08194998b846754eb03fb7fad46daa3593f58ad7ee00",
  "ctf-020": "f2db7ddb5a2afc4fb5f5512fde2125ebe6cc7057466bc9bc157d57ab470a8ae8",
  "ctf-021": "ff0731139b7fef5454edad0a0aa3aece96f32e4862b7f6c215ca83ac00482e5c",
  "ctf-022": "e08898ca1a01ea578f786aa4f2b855fda32659245f1613c7483a4c85d38ff007",
  "ctf-023": "c3b86f88e83c66f4c5b1439c62337bbe5c4da23e7cb0f6a18b82db3a0a125e91",
  "ctf-024": "b8167e874327487e85754c0f4ce171770d83e0e9af6da916d609915e85460a42",
  "ctf-025": "cea2df4a74bacd6f3fb5487c23520a273f14b62dfea2ec5dd30f21729f3d4394",
  "ctf-026": "b8c04e894b93554b21076d9e4cc16678d457aee88ffeba60a2edf3a2f2e9f910",
  "ctf-027": "944ce27a05d7a30db467a6d4da8db531877e5ab87bc759a49a3702b35e31f276",
  "ctf-028": "c6e41d92e8314cb58b0f0dc8b9bda48055dd4cc122f8702d93d9003bceef9a44",
};

function normalizeFlagInput(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

if (typeof module !== 'undefined') { // allow require() in Node (server/tests)
  module.exports = { FLAG_HASHES, normalizeFlagInput };
}
