const fetch = require('node-fetch');

/**
 * Helper to make Monday API requests
 */
async function mondayRequest(apiToken, query, variables = {}) {
    const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': apiToken
        },
        body: JSON.stringify({ query, variables })
    });

    const json = await response.json();
    if (json.errors) {
        throw new Error(JSON.stringify(json.errors));
    }
    return json;
}

/**
 * Creates a board if it doesn't exist.
 * Note: We can't easily check by name without fetching all boards, 
 * so we rely on the caller to check if we already have a stored Board ID.
 */
async function createBoard(apiToken, boardName, kind = 'private') {
    const query = `
        mutation ($boardName: String!, $boardKind: BoardKind!) {
            create_board (board_name: $boardName, board_kind: $boardKind) {
                id
            }
        }
    `;

    // board_kind: public, private, share
    const result = await mondayRequest(apiToken, query, { boardName, boardKind: kind });
    return result.data.create_board.id;
}

/**
 * Creates columns for a specific board.
 * @param {string} boardId 
 * @param {Array} columns - Array of { title, type }
 */
async function createColumns(apiToken, boardId, columns) {
    const query = `
        mutation ($boardId: ID!, $title: String!, $columnType: ColumnType!) {
            create_column (board_id: $boardId, title: $title, column_type: $columnType) {
                id
            }
        }
    `;

    const results = {};
    for (const col of columns) {
        try {
            // Rate limiting might be an issue here, ideally we'd use a queue or delay.
            // For now, simple await.
            const res = await mondayRequest(apiToken, query, {
                boardId: Number(boardId),
                title: col.title,
                columnType: col.type
            });
            results[col.title] = res.data.create_column.id;
        } catch (error) {
            console.warn(`Failed to create column ${col.title} on board ${boardId}:`, error.message);
            // Don't throw, just continue. The column might already exist or be default.
        }
    }
    return results;
}

/**
 * Main provisioning function
 */
exports.provisionMondayBoards = async (apiToken) => {
    const boardIds = {};

    // 1. Invoices Board
    try {
        const id = await createBoard(apiToken, 'Green Truth Invoices', 'private');
        boardIds.invoices = id;
        await createColumns(apiToken, id, [
            { title: 'Amount', type: 'numbers' },
            { title: 'Due Date', type: 'date' },
            { title: 'Dispensary', type: 'text' },
            { title: 'Invoice PDF', type: 'file' } // if possible
            // Status is default
        ]);
    } catch (e) {
        console.error('Error creating Invoices board:', e);
    }

    // 2. Activations Board
    try {
        const id = await createBoard(apiToken, 'Green Truth Activations', 'private');
        boardIds.activations = id;
        await createColumns(apiToken, id, [
            { title: 'Date', type: 'date' },
            { title: 'Location', type: 'location' }, // or text
            { title: 'Type', type: 'status' },
            { title: 'Notes', type: 'long_text' },
            { title: 'Rep', type: 'people' }
        ]);
    } catch (e) {
        console.error('Error creating Activations board:', e);
    }

    // 3. Sales (Orders) Board
    try {
        const id = await createBoard(apiToken, 'Green Truth Sales', 'private');
        boardIds.sales = id;
        await createColumns(apiToken, id, [
            { title: 'Total Amount', type: 'numbers' },
            { title: 'Commission', type: 'numbers' },
            { title: 'Rep', type: 'people' }, // Requires email matching
            { title: 'Items', type: 'long_text' },
            { title: 'Date', type: 'date' }
        ]);
    } catch (e) {
        console.error('Error creating Sales board:', e);
    }

    // 4. Accounts (Leads) Board
    try {
        const id = await createBoard(apiToken, 'Green Truth Accounts', 'private');
        boardIds.accounts = id;
        await createColumns(apiToken, id, [
            { title: 'License', type: 'text' },
            { title: 'Address', type: 'location' },
            { title: 'Stage', type: 'status' }, // Prospect, Active, etc.
            { title: 'Last Visit', type: 'date' },
            { title: 'Active Brands', type: 'tags' } // or text
        ]);
    } catch (e) {
        console.error('Error creating Accounts board:', e);
    }

    return boardIds;
};

/**
 * Provisioning for Dispensaries
 */
exports.provisionDispensaryBoards = async (apiToken) => {
    const boardIds = {};

    // 1. Dispensary Invoices Board
    try {
        const id = await createBoard(apiToken, 'Dispensary Invoices', 'private');
        boardIds.invoices = id;
        await createColumns(apiToken, id, [
            { title: 'Amount', type: 'numbers' },
            { title: 'Due Date', type: 'date' },
            { title: 'Brand', type: 'text' },
            { title: 'Invoice Status', type: 'status' }
        ]);
    } catch (e) {
        console.error('Error creating Dispensary Invoices board:', e);
    }

    return boardIds;
};
