import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {} from 'googlemaps';
import { Lugar } from '../interfaces/lugar';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/services/websocket.service';



@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})

export class MapaComponent implements OnInit {

  constructor(private http:HttpClient,
              private wsservice:WebsocketService) { }

  /*@ViewChild('map') mapaElement!:ElementRef;*/
  @ViewChild('map') mapaElement!:any;
  map!:google.maps.Map;
  marcadores:google.maps.Marker[] =[];
  infoWindow:google.maps.InfoWindow[]=[];

  lugares: Lugar[] = [];
  

  ngOnInit(): void {

  this.http.get('http://localhost:5000/mapas')
  .subscribe((lugares:any)=>{
    this.lugares =lugares;
    console.log(this.lugares);
  })

    setTimeout(()=> {
      // Put the logic here 
      this.cargarMapa();
     
      }, 1000);

    this.escucharSokects();


    
  }

  escucharSokects(){
    //marcador nuevo
    this.wsservice.listen('marcador-nuevo')
    .subscribe((marcador:any) =>{
      
      this.agregarMarcador(marcador);
    });

    //marcador-mover

    this.wsservice.listen('marcador-mover')
    .subscribe((marcador:any)=>{

      for(const i in this.marcadores){

        if(this.marcadores[i].getTitle() === marcador.id){

          const latLng = new google.maps.LatLng(marcador.lat,marcador.lng);
          this.marcadores[i].setPosition(latLng);
          break;
        }
      }

    });

    //marcador-borrar

    this.wsservice.listen('marcador-borrar')
    .subscribe((id:any) =>{
      
      console.log(id);

      for(const i in this.marcadores ){
        if(this.marcadores[i].getTitle() === id){

          this.marcadores[i].setMap(null);
        }
      }

    });

  }



  cargarMapa(){
    const latLng = new google.maps.LatLng(37.784679, -122.395936);
   console.log(latLng);

   const mapaOpciones:google.maps.MapOptions ={
         center:latLng,
          zoom:13,
          mapTypeId:google.maps.MapTypeId.ROADMAP
    }
  
   this.map = new google.maps.Map(this.mapaElement.nativeElement,mapaOpciones);
   
   this.map.addListener('click',(coors)=>{ 
                 
    const nuevoMarcador:Lugar={
        nombre:'Nuvevo Lugar',
        lat:coors.latLng.lat(),
        lng:coors.latLng.lng(),
        id: new Date().toString()  
      };
      
      this.agregarMarcador(nuevoMarcador)

      //emitir evento soket, agregaer maracdor
    
      this.wsservice.emit('marcador-nuevo',nuevoMarcador);
      


                       });


  for(const lugar of this.lugares){
     
    this.agregarMarcador(lugar);

  }
   

  }


  agregarMarcador(marcador:Lugar){
    
    const latLng = new google.maps.LatLng(marcador.lat,marcador.lng );

    const marker = new google.maps.Marker({
      map:this.map,
      animation:google.maps.Animation.DROP,
      position:latLng,
      draggable:true,
      title:marcador.id
    });

    this.marcadores.push(marker);

    const contenido = `<b>${marcador.nombre}</b>`;
    const infoWindow = new google.maps.InfoWindow({
            content:contenido
          });
  
  this.infoWindow.push(infoWindow);

  google.maps.event.addDomListener(marker,'click',()=>{
    this.infoWindow.forEach(infoW => infoW.close())
            infoWindow.open(this.map,marker);
         });
            

    google.maps.event.addDomListener(marker,'dblclick',(coors)=>{
    marker.setMap(null);
    //disparar un evento de marker
    this.wsservice.emit('marcador-borrar',marcador.id);
    });

    google.maps.event.addDomListener(marker,'drag',(coors:any)=>{
      //disparar un evento  agregar marcador

      const nuevoMrcador={
        lat:coors.latLng.lat(),
        lng :coors.latLng.lng(),
        nombre:marcador.nombre,
        id:marker.getTitle()
      }

      this.wsservice.emit('marcador-mover',nuevoMrcador);
      });

  }



}
