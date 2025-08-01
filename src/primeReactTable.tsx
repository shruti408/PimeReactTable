import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber, type InputNumberValueChangeEvent} from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: number;
    date_end: number;
}

export const PrimeReactTable: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [page, setPage] = useState<number>(0);
    const [first, setFirst] = useState<number>(0);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
    const [initialRemainingRows, setInitialRemainingRows] = useState<number>(0);
    const [initialPage, setInitialPage] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const op = useRef<OverlayPanel>(null);

    useEffect(() => {
        fetchData();
    }, [page]);

    // data fetching 
    async function fetchData() {
        setLoading(true);
        try {
            // api call 
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${page + 1}`);
            const data = response.data.data;
            setArtworks(data);
            setTotalRecords(response.data.pagination.total);

            // getting saved data from local storage 
            const savedIds: number[] = JSON.parse(localStorage.getItem(`page-${page + 1}`) || '[]');
            let savedRows = data.filter((row: Artwork) => savedIds.includes(row.id));
            savedRows = [...selectedRows, ...savedRows];

            // form submiision row selection
            if (initialRemainingRows > 0) {
                const currentPage = page + 1;
                const previousSelectedRows = (currentPage - initialPage) * 12;
                if (initialRemainingRows > previousSelectedRows) {
                    const newRemainingRows = initialRemainingRows - previousSelectedRows;
                    const rowsToSelect = [];
                    for (let i = 0; i < Math.min(newRemainingRows, data.length); i++) {
                        rowsToSelect.push(data[i]);
                    }
                    savedRows = [...savedRows, ...rowsToSelect];
                    // saving selected row ids in local storage 
                    const rowIds = rowsToSelect.map((row) => row.id);
                    localStorage.setItem(`page-${page + 1}`, JSON.stringify(rowIds));
                } else {
                    setInitialRemainingRows(0);
                }
            }
            setSelectedRows(savedRows);

        } catch (error) {
            if (error instanceof Error) {
                setError(`There was an error fetching data: ${error.message}`);
            } else {
                setError('There was an unknown error fetching data.');
            }

        }
        setLoading(false);
    };


    // pagination 
    function onPageChange(event: any) {
        setFirst(event.first);
        setPage(event.page)
    };

    // checkbox selection
    function onSelectionChange(event: DataTableSelectionChangeEvent) {
        setSelectedRows(event.value);
        // saving selected row ids in local storage 
        const rowIds = event.value.map((row: Artwork) => {
            return row.id;
        });
        localStorage.setItem(`page-${page + 1}`, JSON.stringify(rowIds));

    }

    // custom number of row selection
    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        op.current?.hide();
        const rowsToSelect = [];
        for (let i = 0; i < Math.min(initialRemainingRows, artworks.length); i++) {
            rowsToSelect.push(artworks[i]);
        }
        // console.log('rowsToSelect', rowsToSelect);
        setSelectedRows(rowsToSelect);
        // saving selected row ids in local storage 
        const rowIds = rowsToSelect.map((row) => row.id);
        localStorage.setItem(`page-${page + 1}`, JSON.stringify(rowIds));

    };
    // form input value change
    function onChange(e: InputNumberValueChangeEvent) {
        setInitialRemainingRows(e.value);
        setInitialPage(page + 1);
    }

    return (
        <div className="card">
            <h2>Artworks</h2>
            <div className="card flex justify-content-center p-4 bg-white">
                <Button
                    type="button"
                    label=""
                    icon="pi pi-chevron-down"
                    onClick={(e) => op.current?.toggle(e)}
                />

                <OverlayPanel ref={op}>
                    <form onSubmit={handleSubmit} className="p-fluid card p-4 w-full  ">
                        <h3>Select Rows</h3>
                        <div className="field">
                            <label htmlFor="rows">Number of Rows</label>
                            <InputNumber
                                id="rows"
                                value={initialRemainingRows}
                                onValueChange={onChange}
                                min={0}
                                max={12000}
                                placeholder="Enter number"
                            />
                        </div>
                        <Button label="Submit" type="submit" />
                    </form>
                </OverlayPanel>
            </div>

            <DataTable
                value={artworks}
                selection={selectedRows}
                onSelectionChange={onSelectionChange}
                dataKey="id"
                selectionMode="multiple"
                paginator
                first={first}
                rows={12}
                lazy
                loading={loading}
                totalRecords={totalRecords}
                onPage={onPageChange}
                tableStyle={{ minWidth: '50rem' }}
            >
                <Column selectionMode="multiple" />
                <Column field="title" header="Title" />
                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Date Start" />
                <Column field="date_end" header="Date End" />
            </DataTable>

            <h2 style={{ color: 'red' }}>{error}</h2>
        </div>
    );
};
