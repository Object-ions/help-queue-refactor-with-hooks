import React, { useEffect, useState } from "react";
import NewTicketForm from "./NewTicketForm";
import TicketList from "./TicketList";
import EditTicketForm from "./EditTicketForm";
import TicketDetail from "./TicketDetail";
import { db, auth } from "./../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

function TicketControl() {
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     formVisibleOnPage: false,
  //     mainTicketList: [],
  //     selectedTicket: null,
  //     editing: false
  //   };
  // }
  const [formVisibleOnPage, setFormVisibleOnPage] = useState(false);
  const [mainTicketList, setMainTicketList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function updateTicketElapsedWaitTime() {
      const newMainTicketList = mainTicketList.map((ticket) => {
        const newFormattedWaitTime = formatDistanceToNow(ticket.timeOpen);
        return { ...ticket, formattedWaitTime: newFormattedWaitTime };
      });
      setMainTicketList(newMainTicketList);
    }

    const waitTimeUpdateTimer = setInterval(
      () => updateTicketElapsedWaitTime(),
      60000
    );

    return function cleanup() {
      clearInterval(waitTimeUpdateTimer);
    };
  }, [mainTicketList]);

  useEffect(() => {
    const queryByTimestamp = query(
      collection(db, "tickets"),
      orderBy("timeOpen")
    );

    const unSubscribe = onSnapshot(
      queryByTimestamp,
      (querySnapshot) => {
        const tickets = [];
        querySnapshot.forEach((doc) => {
          const timeOpen = doc
            .get("timeOpen", { serverTimestamps: "estimate" })
            .toDate();
          const jsDate = new Date(timeOpen);
          tickets.push({
            names: doc.data().names,
            location: doc.data().location,
            issue: doc.data().issue,
            timeOpen: jsDate,
            formattedWaitTime: formatDistanceToNow(jsDate),
            id: doc.id,
          });
        });
        setMainTicketList(tickets);
      },
      (error) => {
        setError(error.message);
      }
    );

    return () => unSubscribe();
  }, []);

  const handleClick = () => {
    if (selectedTicket != null) {
      setFormVisibleOnPage(false);
      setSelectedTicket(null);
      setEditing(false);
    } else {
      setFormVisibleOnPage(!formVisibleOnPage);
    }
  };

  const handleDeletingTicket = async (id) => {
    await deleteDoc(doc(db, "tickets", id));

    // const newMainTicketList = mainTicketList.filter(ticket => ticket.id !== id);
    // setMainTicketList(newMainTicketList);

    // const newMainTicketList = this.state.mainTicketList.filter(
    //   (ticket) => ticket.id !== id
    // );
    // this.setState({
    //   mainTicketList: newMainTicketList,
    //   selectedTicket: null,
    // });
    setSelectedTicket(null);
  };

  const handleEditClick = () => {
    // this.setState({ editing: true });
    setEditing(true);
  };

  // const handleEditingTicketInList = async (ticketToEdit) => {
  //   await updateDoc(doc(db, "tickets", ticketToEdit.id), ticketToEdit);
  //   setEditing(false);
  //   setSelectedTicket(null);
  // }

  const handleEditingTicketInList = async (ticketToEdit) => {
    const ticketRef = doc(db, "tickets", ticketToEdit.id);
    await updateDoc(ticketRef, ticketToEdit);

    // const editedMainTicketList = mainTicketList
    // .filter((ticket) => ticket.id !== selectedTicket.id)
    // .concat(ticketToEdit);
    // setMainTicketList(editedMainTicketList);

    // this.setState({
    //   mainTicketList: editedMainTicketList,
    //   editing: false,
    //   selectedTicket: null,
    // });
    setEditing(false);
    setSelectedTicket(null);
  };

  const handleAddingNewTicketToList = async (newTicketData) => {
    const collectionRef = collection(db, "tickets");
    await addDoc(collectionRef, newTicketData);
    setFormVisibleOnPage(false);
  };

  //same as above
  // const handleAddingNewTicketToList = async (newTicketData) => {
  //   await addDoc(collection(db, "tickets"), newTicketData);
  //   setFormVisibleOnPage(false);
  // }

  // const handleAddingNewTicketToList = (newTicket) => {
  //   const newMainTicketList = mainTicketList.concat(newTicket);
  //   setMainTicketList(newMainTicketList);
  //   setFormVisibleOnPage(false);
  // };

  const handleChangingSelectedTicket = (id) => {
    // const selectedTicket = this.state.mainTicketList.filter(
    //   (ticket) => ticket.id === id
    // )[0];
    // this.setState({ selectedTicket: selectedTicket });
    const selection = mainTicketList.filter((ticket) => ticket.id === id)[0];
    setSelectedTicket(selection);
  };

  if (auth.currentUser == null) {
    return (
      <React.Fragment>
        <h1>You must be signed in to access the queue.</h1>
      </React.Fragment>
    );
  } else if (auth.currentUser != null) {
    let currentlyVisibleState = null;
    let buttonText = null;

    if (error) {
      currentlyVisibleState = <p>There was an error: {error}</p>;
    } else if (editing) {
      currentlyVisibleState = (
        <EditTicketForm
          ticket={selectedTicket}
          onEditTicket={handleEditingTicketInList}
        />
      );
      buttonText = "Return to Ticket List";
    } else if (selectedTicket != null) {
      currentlyVisibleState = (
        <TicketDetail
          ticket={selectedTicket}
          onClickingDelete={handleDeletingTicket}
          onClickingEdit={handleEditClick}
        />
      );
      buttonText = "Return to Ticket List";
    } else if (formVisibleOnPage) {
      currentlyVisibleState = (
        <NewTicketForm onNewTicketCreation={handleAddingNewTicketToList} />
      );
      buttonText = "Return to Ticket List";
    } else {
      currentlyVisibleState = (
        <TicketList
          onTicketSelection={handleChangingSelectedTicket}
          ticketList={mainTicketList}
        />
      );
      buttonText = "Add Ticket";
    }
    return (
      <React.Fragment>
        {currentlyVisibleState}
        {error ? null : <button onClick={handleClick}>{buttonText}</button>}
      </React.Fragment>
    );
  }
}

export default TicketControl;
