import {
    addLog
} from '@/api/record.js'
const handleRecord = async (cpIds, actionType, content) => {
    let query = {
        cpIds: cpIds,
        actionType: actionType,
        content: content
    }
    await addLog(query)
}
export default handleRecord