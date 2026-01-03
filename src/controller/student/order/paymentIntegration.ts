import axios from "axios"

interface IKhaltiData{
    return_url : string, 
    website_url : string, 
    amount : number, 
    purchase_order_id : string, 
    purchase_order_name : string
}

const KhaltiPayment = async(data:IKhaltiData)=>{
    const response = await axios.post("https://dev.khalti.com/api/v2/epayment/initiate/",{
        return_url : data.return_url, 
        website_url : data.website_url, 
        amount : data.amount * 100, 
        purchase_order_id : data.purchase_order_id, 
        purchase_order_name : data.purchase_order_name,  
    },{
        headers : {
            Authorization : "Key b68b4f0f4aa84599ad9b91c475ed6833"
        }
    })
    return response
}



export {KhaltiPayment}