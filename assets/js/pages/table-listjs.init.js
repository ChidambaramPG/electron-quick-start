var userList = new List('users-list', {valueNames: ['name', 'born']}), paginationList = new List('pagination-list', {valueNames: ['name'], page: 4, pagination: !0}), noresultList = new List('noresult-list', {valueNames: ['name']}); noresultList.on('updated', function (e) { e.matchingItems.length > 0 ? $('.error-message').hide() : $('.error-message').show() }); var transactionList = new List('transaction-list', {valueNames: ['name', 'id-no']})
