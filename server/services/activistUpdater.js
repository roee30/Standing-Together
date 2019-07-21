const mongoose = require('mongoose');
const Activist = require('../models/activistModel');
const ContactScan = require('../models/contactScanModel');
const Authentication = require('../services/authentication');
const mailchimpSync = require('../services/mailchimpSync');
const circleFetcher = require("./circleFetcher");
const contactScanFetcher = require("./contactScanFetcher");
const cityFetcher = require("./cityFetcher");
const activistsFetcher = require("./activistsFetcher");
const arrayFunctions = require("./arrayFunctions");

const updateActivists = function(activists){
    let updateQueries = [];
    for(let i = 0; i < activists.length; i++)
    {
        let a = activists[i];
        updateQueries.push(Activist.updateOne({_id: mongoose.Types.ObjectId(a._id)},
            {role: a.role, profile: a.profile, membership: a.membership, "metadata.lastUpdate": new Date()}).exec());
    }
    return Promise.all(updateQueries);
};

const markTypedContactScanRows = function(typerId, scanId, activists, markedDone){
    const today = new Date();
    const scanObjectId = mongoose.Types.ObjectId(scanId);
    return ContactScan.findOne(
        {"_id": scanObjectId}).exec() .then((scanData) => {
            // link to the new activists that have been typed
            let associatedActivists = arrayFunctions.indexByField(scanData.activists, "activistId");
            for(let i = 0; i < activists.length; i++){
                const activist = activists[i];
                //update data on newly typed activists (again, here "new" means "new to the scan", not "new to the system")
                if(!associatedActivists[activist._id]){
                    associatedActivists[activist._id]={
                        "creationDate": today,
                        "lastUpdate": today,
                        "typerId": typerId,
                        "activistId": activist._id,
                        "new": activist.new,
                        "pos": activist.pos,
                        "comments": activist.comments
                    };
                }
                //update data on existing activists (i.e. activists whose details were already typed as part of this scan, and were edited retroactively.
                else{
                    associatedActivists[activist._id].lastUpdate = today;
                    associatedActivists[activist._id].comments = activist.comments;
                    associatedActivists[activist._id].typerId = typerId;
                }
            }
            associatedActivists = Object.values(associatedActivists);
            const updateQuery = ContactScan.updateOne(
                {"_id": scanObjectId},
                {"complete": markedDone, activists: associatedActivists, "metadata.lastUpdate": today}
            ).exec().then(()=> {
                return true;
            });
            return updateQuery;
        }
    );
};

const updateTypedActivists = function(activists){
    const today = new Date();
    let updatePromises = [];
    for(let i=0; i<activists.length; i++){
        const curr = activists[i];
        const query = Activist.updateOne({'_id':curr._id}, {
            "profile.firstName" : curr.firstName,
            "profile.lastName" : curr.lastName,
            "profile.phone" : curr.phone.replace(/[\-.():]/g, ''),
            "profile.email" : curr.email.toLowerCase(),
            "profile.residency" : curr.residency,
            "metadata.lastUpdate" : today,
        });
        updatePromises.push(query.exec());
    }
    return Promise.all(updatePromises);
};
const updateDuplicateActivists = function(activists){
    const today = new Date();
    let updatePromises = [];
    for(let i=0; i<activists.length; i++){
        const curr = activists[i];
        const query = Activist.updateOne({'_id':curr._id}, {
            $push: { "profile.participatedEvents": curr.eventId },
            "metadata.lastUpdate" : today
        });
        updatePromises.push(query.exec());
    }
    return Promise.all(updatePromises);
};
/*const insertActivists = function(req, res){
    const newActivist = new Activist(req.body);
    newActivist.save(function (err) {
        if (err){
            return res.json(err);
        }
        else
            return res.json(req.body);
    });
};*/
const toggleActivistStatus = function(req, res){
    Authentication.hasRole(req, res, "isOrganizer").then(isUser=>{
        if(!isUser)
            return res.json({"error":"missing token"});
        const activistId = req.body.activistId;
        const isCaller = req.body.status;
        let query = Activist.update({'_id':activistId},{'role.isCaller': isCaller});
        return query.exec().then(()=>{
            return res.json({"result":"set status to "+isCaller+" for user "+activistId});
        });
    });
};
const addToMailchimpCircle = function(activists){
    if(!activists || !activists.length){
        return true;
    }
    let updatePromises = [];
    const fetchPromises = [cityFetcher.getCities(), circleFetcher.getCircles()];
    Promise.all(fetchPromises).then((results)=>{
            const cities = arrayFunctions.indexByField(results[0], "name");
            const circles = arrayFunctions.indexByField(results[1], "name");
            for(let i = 0; i < activists.length; i++){
                let curr = activists[i];
                if (curr.profile.residency
                    && cities[curr.profile.residency]
                    && cities[curr.profile.residency].defaultCircle
                    && circles[cities[curr.profile.residency].defaultCircle]
                    && circles[cities[curr.profile.residency].defaultCircle].mailchimpList
                ){
                    updatePromises.push(mailchimpSync.createContacts([curr], circles[cities[curr.profile.residency].defaultCircle].mailchimpList));
                }
            }
            updatePromises.push(mailchimpSync.createContacts(activists));
        }
     );
    return Promise.all(updatePromises);
};
const checkForDuplicates = function (activists, scanId){
    return contactScanFetcher.getById(scanId).then((scanData)=>{
        const phones = activists.map((a)=>{return a.profile.phone.replace(/[\-.():]/g, '')}).filter(phone => phone && phone.length > 3);
        const emails = activists.map((a)=>{return a.profile.email.toLowerCase()}).filter(email => email && email.length > 3);
        let oldActivists = [];
        const duplicates = activistsFetcher.searchDuplicates(phones, emails).then(duplicates => {
            const duplicatesByPhone = arrayFunctions.indexByField(duplicates, "phone");
            const duplicatesByEmail = arrayFunctions.indexByField(duplicates, "email");
            for(let i = 0; i < activists.length; i++){
                //select an activist out of the newly input activists
                let curr = activists[i];
                //if the activist's phone/email is a duplicate of an existing phone/email, this should point to the existing activist row
                let duplicateOf = duplicatesByPhone[curr.profile.phone] || duplicatesByEmail[curr.profile.email];
                if(duplicateOf){
                    curr._id = duplicateOf._id;
                    curr.eventId = scanData.eventId;
                    oldActivists.push(curr);
                    //flag contact from removal from "new contacts" array
                    curr.isDuplicate = true;
                }
            }
            activists = activists.filter(activist => !activist.isDuplicate);
            return {nonDuplicates: activists, duplicates: oldActivists};
        });
        return duplicates;
    });
};
const uploadTypedActivists = function (typedActivists, scanId, markedDone){
    const typerId = Authentication.getMyId();
    //activists who don't have an id attached
    let newActivists = [];
    //activists whose records have already been typed and submitted as part of this specific scan page,
    //and have subsequently been updated by some typer.
    let updatedActivists = [];
    const today = new Date();
    for (let i=0; i<typedActivists.length; i++)
    {
        let curr = typedActivists[i];
        if(!curr._id){
            newActivists.push(
                {
                    "_id": mongoose.Types.ObjectId(),
                    "metadata" : {
                        "creationDate" : today,
                        "lastUpdate" : today,
                        "joiningMethod" : "contactPage",
                        "typerId" : typerId,
                        "scanId": scanId,
                        "scanRow": curr.scanRow
                    },
                    "profile" : {
                        "firstName" : curr.firstName,
                        "lastName" : curr.lastName,
                        "phone" : curr.phone.replace(/[\-.():]/g, ''),
                        "email" : curr.email.toLowerCase(),
                        "residency" : curr.residency,
                        "comments" : curr.comments,
                        "circle" : "",
                        "isMember" : false,
                        "isPaying" : false,
                        "isNewsletter" : "not subscribed",
                        "participatedEvents" : []
                    },
                    "role" : {
                        "isTyper" : false,
                        "isCaller" : false,
                        "isOrganizer" : false,
                        "isCircleLeader" : false
                    },
                    "login" : {
                        "loginCode" : null,
                        "token" : []
                    },
                    "pos": i
                });
        }
        else{
            if(!curr.locked) {
                updatedActivists.push(curr);
            }
        }
    }
    return new Promise((resolve, reject)=> {
        //update activists whose rows were previously submitted as part of this scan, and subsequently edited
        updateTypedActivists(updatedActivists).then(() => {
            //mark activists whose phones or emails are already stored
            checkForDuplicates(newActivists, scanId).then((result) => {
                const nonDuplicates = result.nonDuplicates;
                const duplicates = result.duplicates;
                const insertDuplicates = updateDuplicateActivists(duplicates);
                const insertNonDuplicates = Activist.insertMany(nonDuplicates);
                return Promise.all([insertDuplicates, insertNonDuplicates]).then(function (result) {
                    if (result) {
                        let tasks = [];
                        //create a mailchimp record in the main contact list
                        //tasks.push(mailchimpSync.createContacts(newActivists));
                        //create a mailchimp record in the circle-specific contact list
                        tasks.push(addToMailchimpCircle(nonDuplicates));
                        //mark the activist as typed in the relevant contact scan
                        let activistRows = duplicates.map((a) => {
                            return {
                                _id: a._id,
                                new: false,
                                pos: a.pos,
                                comments: a.profile.comments
                            };
                        }).concat(nonDuplicates.map((a) => {
                            return {
                                _id: a._id,
                                new: true,
                                pos: a.pos,
                                comments: a.profile.comments
                            };
                        })).concat(updatedActivists.map((a) => {
                            return {
                                _id: a._id,
                                comments: a.comments,
                            };
                        }));
                        if (scanId) {
                            tasks.push(markTypedContactScanRows(typerId, scanId, activistRows, markedDone));
                        }
                        return Promise.all(tasks).then((results) => {
                            resolve(true);
                        })
                    } else {
                        resolve({"error": "an unknown error has occurred, the activists were not saved"});
                    }
                });
            });
        });
    });
};

module.exports = {
    uploadTypedActivists,
    toggleActivistStatus,
    updateActivists
};