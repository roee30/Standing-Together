const indexByField = function(array, indexBy){
    const dict = {};
    for(let i=0; i<array.length; i++){
        let elem = array[i];
        elem._index=i;
        dict[elem[indexBy]]=elem;
    }
    return dict;
};

module.exports = {
    indexByField
};

