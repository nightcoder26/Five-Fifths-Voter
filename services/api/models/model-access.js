const debug = require("debug")("teams:model")
const Ajv = require("ajv")
const ajv = new Ajv({ removeAdditional: true })
const lodash = require("lodash")
const { v4: uuid } = require("uuid")

const DOC_TYPE = "access"
const PARTITION = "teams"
const ROLES = ["admin", "editor", "user", "removed"]
const ROLE_NUM = { admin: 100, editor: 50, user: 10, removed: Number.MIN_SAFE_INTEGER }

const schema = {
  type: "object",
  properties: {
    _id: { type: "string" }, // cloudant
    _rev: { type: "string" }, // cloudant
    doc_type: { type: "string", const: DOC_TYPE },
    creator_sub: { type: "string" }, // unique id from APP ID
    date_created: { type: "string" }, // Date.toISOString()
    date_modified: { type: "string" }, // Date.toISOString()
    email: { type: "string", minLength: 6 },
    team: { type: "string", minLength: 1 }, // slug for the team
    sub: { type: "string" }, // user unique name after they accept the invitation
    acl: { type: "string", enum: ROLES },
    status: { type: "string", enum: ["accepted", "ignored", "invited"] },
  },
  required: ["doc_type", "email", "team", "acl", "status"],
  additionalProperties: false,
}

const validate = ajv.compile(schema)

module.exports = {
  validate,

  PARTITION,
  ROLE_NUM,

  /**
   * Get a blank document with required fields
   * @returns { email: "", team: "", status: "invited" }
   */
  blank() {
    return lodash.cloneDeep({
      _id: `${PARTITION}:${uuid().replace(/-/g, "")}`,
      email: "",
      team: "",
      status: "invited",
    })
  },

  /**
   * Remove special properties from doc in anticipation of using it to create a new doc
   * @param {object} doc
   */
  creating(doc) {
    delete doc._id
    delete doc._rev
    delete doc.creator_sub
    delete doc.date_created
  },

  /**
   * Update the dates and creator
   * @param {string} sub
   * @param {object} doc
   */
  update(sub, doc, teamId) {
    if (!doc._id) doc._id = `${PARTITION}:${uuid().replace(/-/g, "")}`
    if (!doc.creator_sub) doc.creator_sub = sub
    if (!doc.date_created) doc.date_created = new Date().toISOString()
    doc.email = doc.email.toLowerCase()
    doc.team = teamId
    doc.date_modified = new Date().toISOString()
    doc.doc_type = DOC_TYPE
    debug("update", doc)
  },
}
